# Page snapshot

```yaml
- generic [ref=e2]:
  - link "← Back to Calculator List" [ref=e3] [cursor=pointer]:
    - /url: index.html
  - heading "BMI and BSA Calculator" [level=1] [ref=e4]
  - generic [ref=e5]: Failed to initialize SMART on FHIR client.
  - separator
  - generic [ref=e7]:
    - generic [ref=e8]:
      - heading "BMI & Body Surface Area (BSA)" [level=3] [ref=e9]
      - paragraph [ref=e10]: Calculates Body Mass Index (BMI) and Body Surface Area (BSA) for clinical assessment and medication dosing.
    - generic [ref=e11]:
      - generic [ref=e12]: Patient Measurements
      - generic [ref=e13]:
        - generic [ref=e14]: Weight
        - spinbutton "Weight" [ref=e16]: "80"
      - generic [ref=e17]:
        - generic [ref=e18]: Height
        - spinbutton "Height" [active] [ref=e20]: "180"
    - generic [ref=e21]:
      - heading "Formulas" [level=4] [ref=e22]
      - generic [ref=e23]:
        - strong [ref=e24]: "BMI (Body Mass Index):"
        - generic [ref=e25]: BMI = Weight (kg) / Height² (m²)
      - generic [ref=e26]:
        - strong [ref=e27]: "BSA (Body Surface Area - Du Bois Formula):"
        - generic [ref=e28]:
          - text: BSA = 0.007184 × Weight
          - superscript [ref=e29]: "0.425"
          - text: (kg) × Height
          - superscript [ref=e30]: "0.725"
          - text: (cm)
```