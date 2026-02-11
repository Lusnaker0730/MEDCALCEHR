// src/twcore/concept-maps.ts
// ConceptMap lookup tables for TW Core IG v1.0.0
// Verified against twcore/package.tgz (tw.gov.mohw.twcore v1.0.0, 2025-12-10)
// Source: ConceptMap/medication-frequency-tw, ConceptMap/medication-path-tw

/**
 * NHI medication frequency codes → HL7 v3 GTSAbbreviation timing mapping
 * Source: TW Core ConceptMap medication-frequency-tw
 * Source system: medication-frequency-nhi-tw
 * Target system: http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation
 */
export const MEDICATION_FREQUENCY_MAP: ReadonlyArray<{
    nhiCode: string;
    nhiDisplay: string;
    hl7Code: string;
    hl7Display: string;
}> = [
    { nhiCode: 'QD', nhiDisplay: '每日一次', hl7Code: 'QD', hl7Display: 'QD' },
    { nhiCode: 'QDAM', nhiDisplay: '每日一次上午使用', hl7Code: 'AM', hl7Display: 'AM' },
    { nhiCode: 'QDPM', nhiDisplay: '每日一次下午使用', hl7Code: 'PM', hl7Display: 'PM' },
    { nhiCode: 'QDHS', nhiDisplay: '每日一次睡前使用', hl7Code: 'BED', hl7Display: 'at bedtime' },
    { nhiCode: 'BID', nhiDisplay: '每日二次', hl7Code: 'BID', hl7Display: 'BID' },
    { nhiCode: 'QID', nhiDisplay: '每日四次', hl7Code: 'QID', hl7Display: 'QID' },
    { nhiCode: 'QOD', nhiDisplay: '隔日使用一次', hl7Code: 'QOD', hl7Display: 'QOD' },
    { nhiCode: 'QW', nhiDisplay: '每週一次', hl7Code: 'WK', hl7Display: 'weekly' },
    { nhiCode: 'HS', nhiDisplay: '睡前一次', hl7Code: 'BED', hl7Display: 'at bedtime' },
] as const;

/**
 * TW medication route codes → SNOMED CT route of administration mapping
 * Source: TW Core ConceptMap medication-path-tw
 * Source system: medication-path-tw
 * Target system: http://snomed.info/sct
 * (24 mapped routes out of 42 total medication-path-tw codes)
 */
export const MEDICATION_ROUTE_TO_SNOMED: ReadonlyArray<{
    twCode: string;
    twDisplay: string;
    snomedCode: string;
    snomedDisplay: string;
}> = [
    { twCode: 'PO', twDisplay: '口服', snomedCode: '26643006', snomedDisplay: 'Oral use' },
    { twCode: 'SL', twDisplay: '舌下', snomedCode: '37839007', snomedDisplay: 'Sublingual use' },
    { twCode: 'RECT', twDisplay: '肛門用', snomedCode: '37161004', snomedDisplay: 'Rectal use' },
    { twCode: 'VAG', twDisplay: '陰道用', snomedCode: '16857009', snomedDisplay: 'Vaginal use' },
    { twCode: 'SC', twDisplay: '皮下注射', snomedCode: '34206005', snomedDisplay: 'SC use' },
    { twCode: 'IM', twDisplay: '肌肉注射', snomedCode: '78421000', snomedDisplay: 'Intramuscular use' },
    { twCode: 'IA', twDisplay: '動脈注射', snomedCode: '58100008', snomedDisplay: 'Intra-arterial use' },
    { twCode: 'ID', twDisplay: '皮內注射', snomedCode: '372464004', snomedDisplay: 'Intradermal use' },
    { twCode: 'IVA', twDisplay: '靜脈添加', snomedCode: '47625008', snomedDisplay: 'Intravenous use' },
    { twCode: 'IVD', twDisplay: '靜脈點滴滴入', snomedCode: '47625008', snomedDisplay: 'Intravenous use' },
    { twCode: 'IVP', twDisplay: '靜脈注入', snomedCode: '47625008', snomedDisplay: 'Intravenous use' },
    { twCode: 'IVI', twDisplay: '玻璃体內注射', snomedCode: '418401004', snomedDisplay: 'Intravitreal route' },
    { twCode: 'NA', twDisplay: '鼻用', snomedCode: '46713006', snomedDisplay: 'Nasal use' },
    { twCode: 'AD', twDisplay: '右耳', snomedCode: '10547007', snomedDisplay: 'Auricular use' },
    { twCode: 'AS', twDisplay: '左耳', snomedCode: '10547007', snomedDisplay: 'Auricular use' },
    { twCode: 'AU', twDisplay: '每耳', snomedCode: '10547007', snomedDisplay: 'Auricular use' },
    { twCode: 'OD', twDisplay: '右眼', snomedCode: '54485002', snomedDisplay: 'Ophthalmic use' },
    { twCode: 'OS', twDisplay: '左眼', snomedCode: '54485002', snomedDisplay: 'Ophthalmic use' },
    { twCode: 'OU', twDisplay: '每眼', snomedCode: '54485002', snomedDisplay: 'Ophthalmic use' },
    { twCode: 'TOPI', twDisplay: '局部塗擦', snomedCode: '6064005', snomedDisplay: 'Topical route' },
    { twCode: 'EXT', twDisplay: '外用', snomedCode: '6064005', snomedDisplay: 'Topical route' },
    { twCode: 'SKIN', twDisplay: '皮膚用', snomedCode: '448598008', snomedDisplay: 'Cutaneous route' },
    { twCode: 'HD', twDisplay: '皮下灌注', snomedCode: '1611000175109', snomedDisplay: 'Sublesional route' },
    { twCode: 'SCI', twDisplay: '結膜下注射', snomedCode: '416174007', snomedDisplay: 'Suborbital use' },
] as const;

/**
 * Look up HL7 timing code for an NHI frequency code
 */
export function getNHIFrequencyMapping(nhiCode: string): typeof MEDICATION_FREQUENCY_MAP[number] | undefined {
    return MEDICATION_FREQUENCY_MAP.find(m => m.nhiCode === nhiCode);
}

/**
 * Look up SNOMED route code for a TW medication route code
 */
export function getTWRouteToSNOMED(twRouteCode: string): typeof MEDICATION_ROUTE_TO_SNOMED[number] | undefined {
    return MEDICATION_ROUTE_TO_SNOMED.find(m => m.twCode === twRouteCode);
}
