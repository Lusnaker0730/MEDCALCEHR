// Redirect to launch.html if this page is loaded directly,
// the URL doesn't contain a "state" parameter,
// and there is no active FHIR session data in sessionStorage.
(function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('state') && !sessionStorage.getItem('SMART_KEY')) {
        window.location.href = 'launch.html';
    }
})();
