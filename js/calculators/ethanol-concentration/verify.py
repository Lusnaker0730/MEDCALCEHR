import csv
import random

def calculate_ethanol_reference(volume_ml, abv, weight_kg, gender):
    vd = 0.68 if gender == 'male' else 0.55
    grams_alcohol = volume_ml * (abv / 100.0) * 0.789
    # Formula results in mg/dL
    # (grams * 1000) / (weight * vd * 10)
    concentration_mg_dl = (grams_alcohol * 1000) / (weight_kg * vd * 10)
    return concentration_mg_dl

def generate_golden_dataset(filename="verification_dataset.csv", n=100):
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['volume_ml', 'abv', 'weight_kg', 'gender', 'expected_concentration'])

        # 1. Standard Cases
        for _ in range(60):
            volume = random.randint(30, 500) # mL, approx 1 oz to 1 pint
            abv = random.choice([5, 12, 40]) # Beer, Wine, Spirits
            weight = random.randint(50, 120) # kg
            gender = random.choice(['male', 'female'])
            
            res = calculate_ethanol_reference(volume, abv, weight, gender)
            writer.writerow([volume, abv, weight, gender, f"{res:.6f}"])

        # 2. High Consumption (Severe/Fatal)
        for _ in range(30):
            volume = random.randint(300, 1000) 
            abv = 40
            weight = random.randint(50, 90)
            gender = random.choice(['male', 'female'])
            res = calculate_ethanol_reference(volume, abv, weight, gender)
            writer.writerow([volume, abv, weight, gender, f"{res:.6f}"])
            
        # 3. Edge Cases
        # Low weight, high volume
        writer.writerow([500, 40, 40, 'female', f"{calculate_ethanol_reference(500, 40, 40, 'female'):.6f}"])
        # Min weight
        writer.writerow([30, 5, 10, 'male', f"{calculate_ethanol_reference(30, 5, 10, 'male'):.6f}"])

    print(f"Generated {n} verification cases in {filename}")

if __name__ == "__main__":
    generate_golden_dataset()
