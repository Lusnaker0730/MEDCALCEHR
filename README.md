# CGMH EHRCALC on FHIR

This is a SMART on FHIR application that provides a collection of clinical calculators, inspired by MDCalc.

## How to Run

1.  You need a web server to serve these files. A simple way is to use Python's built-in server. From the project root, run:
    ```bash
    python -m http.server
    ```
    Or for Python 2:
    ```bash
    python -m SimpleHTTPServer
    ```

2.  Once the server is running (e.g., at `http://localhost:8000`), you can launch the app from a SMART on FHIR launcher, such as the one provided by SMART Health IT.

3.  Go to the [SMART Health IT Launcher](https://launch.smarthealthit.org/).
4.  For "App Launch URL", enter `http://localhost:8000/launch.html`.
5.  Launch the app for a patient. The app should load and display the patient's information and a BMI calculator.
