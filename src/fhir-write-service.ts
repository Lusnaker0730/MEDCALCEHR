/**
 * FHIR Write-back Service
 * Writes calculator results as FHIR Observation resources back to the EHR.
 * Controlled by feature flag: window.MEDCALC_CONFIG.enableWriteBack
 *
 * Creates:
 * 1. Observation resource with calculation result
 * 2. Provenance resource tracking the calculation event
 */

import { logger } from './logger.js';
import { isAuthError } from './fhir-auth-interceptor.js';
import { tokenLifecycleManager } from './token-lifecycle-manager.js';
import { provenanceService } from './provenance-service.js';
import { securityLabelsService } from './security-labels-service.js';
import type { SecuredResource, SensitivityCategory } from './security-labels-service.js';

// ============================================================================
// Types
// ============================================================================

export interface WriteBackResult {
    label: string;
    value: number | string;
    unit?: string;
    loincCode?: string;
}

export interface WriteBackRequest {
    calculatorId: string;
    calculatorTitle: string;
    patientId: string;
    results: WriteBackResult[];
}

export interface WriteBackResponse {
    success: boolean;
    observationIds: string[];
    provenanceId?: string;
    error?: string;
}

// ============================================================================
// FHIR Write Service
// ============================================================================

class FHIRWriteService {
    private client: any = null;

    /**
     * Check if write-back is enabled via feature flag.
     */
    isEnabled(): boolean {
        return window.MEDCALC_CONFIG?.enableWriteBack === true;
    }

    /**
     * Set the FHIR client instance.
     */
    setClient(client: any): void {
        this.client = client;
    }

    /**
     * Write calculator results back to the EHR as FHIR Observations.
     */
    async writeResults(request: WriteBackRequest): Promise<WriteBackResponse> {
        if (!this.isEnabled()) {
            return {
                success: false,
                observationIds: [],
                error: 'Write-back is disabled',
            };
        }

        if (!this.client) {
            return {
                success: false,
                observationIds: [],
                error: 'FHIR client not available',
            };
        }

        // H-04/H-05: Validate patient context matches request
        if (this.client?.patient?.id && request.patientId !== this.client.patient.id) {
            logger.error('Write-back rejected: patientId mismatch', {
                requestPatient: request.patientId,
                contextPatient: this.client.patient.id
            });
            return { success: false, observationIds: [], error: 'Patient ID mismatch with SMART context' };
        }

        const observationIds: string[] = [];

        try {
            for (const result of request.results) {
                if (typeof result.value !== 'number') continue; // Skip non-numeric results

                const observation = this.buildObservation(request, result);
                const response = await this.client.create(observation);

                if (response?.id) {
                    observationIds.push(response.id);
                }
            }

            // Create Provenance resource for the calculation
            let provenanceId: string | undefined;
            if (observationIds.length > 0) {
                try {
                    const provenance = await provenanceService.recordCalculation({
                        calculatorId: request.calculatorId,
                        calculatorName: request.calculatorTitle,
                        inputs: {},
                        outputs: Object.fromEntries(
                            request.results.map(r => [r.label, r.value])
                        ),
                        timestamp: new Date(),
                        patientId: request.patientId,
                    });

                    provenanceId = provenance?.id;
                } catch (provError) {
                    logger.warn('Failed to create Provenance resource', {
                        error: String(provError),
                    });
                }
            }

            logger.info('Write-back completed', {
                calculatorId: request.calculatorId,
                observationCount: observationIds.length,
                provenanceId,
                securityLabelsApplied: true,
            });

            return {
                success: true,
                observationIds,
                provenanceId,
            };
        } catch (error) {
            if (isAuthError(error)) {
                tokenLifecycleManager.handleAuthFailure((error as any)?.status);
            }
            logger.error('Write-back failed', {
                calculatorId: request.calculatorId,
                error: String(error),
            });

            return {
                success: false,
                observationIds,
                error: 'Write operation failed. Please try again.',
            };
        }
    }

    /**
     * Build a FHIR Observation resource from a calculation result.
     */
    private buildObservation(request: WriteBackRequest, result: WriteBackResult): any {
        const now = new Date().toISOString();

        // M-13: Sanitize string fields before building FHIR resource
        const safeTitle = (request.calculatorTitle || '').slice(0, 200);
        const safeLabel = (result.label || '').slice(0, 100);
        const safeCalcId = (request.calculatorId || '').replace(/[^a-z0-9-]/gi, '');

        const observation: any = {
            resourceType: 'Observation',
            status: 'final',
            category: [
                {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                            code: 'survey',
                            display: 'Survey',
                        },
                    ],
                    text: 'Clinical Calculator Result',
                },
            ],
            code: {
                text: `${safeTitle} - ${safeLabel}`,
            },
            subject: {
                reference: `Patient/${request.patientId}`,
            },
            effectiveDateTime: now,
            issued: now,
            valueQuantity: {
                value: result.value,
                unit: result.unit || 'score',
                system: 'http://unitsofmeasure.org',
                code: result.unit || '{score}',
            },
            note: [
                {
                    text: `Calculated by MEDCALCEHR - ${safeTitle} (${safeCalcId})`,
                },
            ],
        };

        // Add LOINC coding if available
        if (result.loincCode) {
            observation.code.coding = [
                {
                    system: 'http://loinc.org',
                    code: result.loincCode,
                    display: safeLabel,
                },
            ];
        }

        // Apply security labels
        const sensitivities: SensitivityCategory[] = securityLabelsService.detectSensitivities(
            observation as SecuredResource
        );
        const confidentiality = sensitivities.some(s => s !== 'GENERAL') ? 'R' : 'N';
        const labeled = securityLabelsService.addSecurityLabel(
            observation as SecuredResource,
            confidentiality,
            sensitivities
        );

        return labeled;
    }
}

export const fhirWriteService = new FHIRWriteService();
