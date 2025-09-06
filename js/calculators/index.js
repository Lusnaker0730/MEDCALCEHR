// js/calculators/index.js
import { bmiBsa } from './bmi-bsa.js';
import { crcl } from './crcl.js';
import { ckdEpi } from './ckd-epi.js';
import { map } from './map.js';
import { afRisk } from './af-risk.js';
import { ascvd } from './ascvd.js';
import { calciumCorrection } from './calcium-correction.js';
import { wellsPE } from './wells-pe.js';
import { qtc } from './qtc.js';
import { mdrdGfr } from './mdrd-gfr.js';
import { ibw } from './ibw.js';
import { fib4 } from './fib-4.js';
import { nihss } from './nihss.js';
import { rcri } from './rcri.js';
import { dueDate } from './due-date.js';
import { childPugh } from './child-pugh.js';
import { stopBang } from './stop-bang.js';
import { wellsDVT } from './wells-dvt.js';
import { heartScore } from './heart-score.js';
import { phq9 } from './phq-9.js';
import { ariscat } from './ariscat.js';
import { caprini } from './caprini.js';
import { centor } from './centor.js';
import { ciwaAr } from './ciwa-ar.js';
import { curb65 } from './curb-65.js';
import { dasi } from './dasi.js';
import { fena } from './fena.js';
import { framingham } from './framingham.js';
import { freeWaterDeficit } from './free-water-deficit.js';
import { gad7 } from './gad-7.js';
import { gcs } from './gcs.js';
import { genevaScore } from './geneva-score.js';
import { guptaMica } from './gupta-mica.js';
import { homaIr } from './homa-ir.js';
import { ldl } from './ldl.js';
import { maintenanceFluids } from './maintenance-fluids.js';
import { meldNa } from './meld-na.js';
import { mme } from './mme.js';
import { pecarn } from './pecarn.js';
import { perc } from './perc.js';
import { qsofaScore } from './qsofa.js';
import { ransonScore } from './ranson.js';
import { sirs } from './sirs.js';
import { sodiumCorrection } from './sodium-correction.js';
import { sofa } from './sofa.js';
import { steroidConversion } from './steroid-conversion.js';
import { serumAnionGap } from './serum-anion-gap.js';
import { serumOsmolality } from './serum-osmolality.js';
import { paduaVTE } from './padua-vte.js';
import { preventCVD } from './prevent-cvd.js';
import { graceAcs } from './grace-acs.js';
import { helps2bScore } from './2helps2b.js';
import { a4sDelirium } from './4as-delirium.js';
import { peps4Score } from './4peps.js';
import { covid4cScore } from './4c-mortality-covid.js';
import { a4tsHit } from './4ts-hit.js';
import { sixMwd } from './6mwd.js';
import { phenytoinCorrection } from './phenytoin-correction.js';
import { nafldFibrosisScore } from './nafld-fibrosis-score.js';
import { ethanolConcentration } from './ethanol-concentration.js';
import { abl } from './abl.js';
import { ett } from './ett.js';
import { tpaDosing } from './tpa-dosing.js';
import { ttkg } from './ttkg.js';
import { actionIcu } from './action-icu.js';
import { score2Diabetes } from './score2-diabetes.js';
import { gwtgHf } from './gwtg-hf.js';
import { maggic } from './maggic.js';
import { kawasaki } from './kawasaki.js';
import { abgAnalyzer } from './abg-analyzer.js';
import { intraopFluid } from './intraop-fluid.js';
import { apgarScore } from './apgar.js';
import { bwps } from './bwps.js';
import { apacheIi } from './apache-ii.js';
import { isthDic } from './isth-dic.js';
import { hscore } from './hscore.js';
import { charlson } from './charlson.js';


// An array that aggregates all calculator modules
export const calculatorModules = [
    bmiBsa,
    crcl,
    ckdEpi,
    map,
    afRisk,
    ascvd,
    calciumCorrection,
    wellsPE,
    qtc,
    mdrdGfr,
    ibw,
    fib4,
    nihss,
    rcri,
    dueDate,
    childPugh,
    stopBang,
    wellsDVT,
    heartScore,
    phq9,
    ariscat,
    caprini,
    centor,
    ciwaAr,
    curb65,
    dasi,
    fena,
    framingham,
    freeWaterDeficit,
    gad7,
    gcs,
    genevaScore,
    guptaMica,
    homaIr,
    ldl,
    maintenanceFluids,
    meldNa,
    mme,
    pecarn,
    perc,
    qsofaScore,
    ransonScore,
    sirs,
    sodiumCorrection,
    sofa,
    steroidConversion,
    serumAnionGap,
    serumOsmolality,
    paduaVTE,
    preventCVD,
    graceAcs,
    helps2bScore,
    a4sDelirium,
    peps4Score,
    covid4cScore,
    a4tsHit,
    sixMwd,
    phenytoinCorrection,
    nafldFibrosisScore,
    ethanolConcentration,
    abl,
    ett,
    tpaDosing,
    ttkg,
    actionIcu,
    score2Diabetes,
    gwtgHf,
    maggic,
    kawasaki,
    abgAnalyzer,
    intraopFluid,
    apgarScore,
    bwps,
    apacheIi,
    isthDic,
    hscore,
    charlson
].sort((a, b) => a.title.localeCompare(b.title));
