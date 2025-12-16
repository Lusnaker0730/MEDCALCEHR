import csv
import random
import math

# Reference Formula Implementation
def calculate_nafld_reference(age, bmi, diabetes, ast, alt, platelet, albumin):
    ast_alt_ratio = ast / alt
    score = -1.675 + (0.037 * age) + (0.094 * bmi) + (1.13 * diabetes) + (0.99 * ast_alt_ratio) - (0.013 * platelet) - (0.66 * albumin)
    return score

# Generate Golden Dataset
def generate_golden_dataset(filename="verification_dataset.csv", n=100):
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        # Header
        writer.writerow(['age', 'bmi', 'diabetes', 'ast', 'alt', 'platelet', 'albumin', 'expected_score'])

        # 1. Normal/Typical Cases
        for _ in range(60):
            age = random.randint(35, 65)
            bmi = round(random.uniform(20.0, 40.0), 1)
            diabetes = random.choice([0, 1])
            ast = random.randint(15, 100)
            alt = random.randint(15, 100)
            platelet = random.randint(100, 400) # x10^9/L
            albumin = round(random.uniform(3.0, 5.0), 1) # g/dL
            
            score = calculate_nafld_reference(age, bmi, diabetes, ast, alt, platelet, albumin)
            writer.writerow([age, bmi, diabetes, ast, alt, platelet, albumin, f"{score:.6f}"])

        # 2. Pathological / Extreme Cases
        for _ in range(30):
            age = random.randint(18, 90)
            bmi = round(random.uniform(35.0, 60.0), 1)
            diabetes = 1
            ast = random.randint(80, 300)
            alt = random.randint(20, 80) # High AST/ALT ratio
            platelet = random.randint(20, 100) # Low platelet
            albumin = round(random.uniform(2.0, 3.5), 1) # Low albumin
            
            score = calculate_nafld_reference(age, bmi, diabetes, ast, alt, platelet, albumin)
            writer.writerow([age, bmi, diabetes, ast, alt, platelet, albumin, f"{score:.6f}"])

        # 3. Boundary/Edge Cases
        # High BMI, Low Platelets
        writer.writerow([50, 50.0, 1, 200, 50, 50, 2.5, f"{calculate_nafld_reference(50, 50.0, 1, 200, 50, 50, 2.5):.6f}"])
        # Low BMI, High Platelets
        writer.writerow([50, 18.5, 0, 20, 20, 450, 5.5, f"{calculate_nafld_reference(50, 18.5, 0, 20, 20, 450, 5.5):.6f}"])
        
    print(f"Generated {n} verification cases in {filename}")

if __name__ == "__main__":
    generate_golden_dataset()
