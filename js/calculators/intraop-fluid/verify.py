import csv
import random

def calculate_intraop_reference(weight_kg, npo_hours, trauma_level):
    if weight_kg <= 10:
        return 0, 0, 0, 0, 0, 0 # Invalid
    
    # 4-2-1 Rule
    if weight_kg > 20:
        maint = weight_kg + 40
    elif weight_kg > 10:
        maint = 40 + (weight_kg - 10) * 2
    else:
        maint = weight_kg * 4 # Should not happen based on constraint
        
    npo_deficit = maint * npo_hours
    trauma_loss = trauma_level * weight_kg
    
    first_hr = (npo_deficit / 2) + maint + trauma_loss
    second_hr = (npo_deficit / 4) + maint + trauma_loss
    third_hr = (npo_deficit / 4) + maint + trauma_loss
    fourth_hr = maint + trauma_loss
    
    return maint, npo_deficit, first_hr, second_hr, third_hr, fourth_hr

def generate_golden_dataset(filename="verification_dataset.csv", n=100):
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['weight_kg', 'npo_hours', 'trauma_level', 'maint', 'npo_deficit', 'first_hr', 'second_hr', 'third_hr', 'fourth_hr'])

        # 1. Standard Adult
        for _ in range(70):
            weight = random.randint(40, 120)
            npo = random.randint(0, 12)
            trauma = random.choice([4, 6, 8])
            
            res = calculate_intraop_reference(weight, npo, trauma)
            writer.writerow([weight, npo, trauma] + [f"{x:.1f}" for x in res])

        # 2. Pediatric (>10kg) but small
        for _ in range(20):
            weight = random.randint(11, 30)
            npo = random.randint(0, 8)
            trauma = random.choice([4, 6, 8])
            res = calculate_intraop_reference(weight, npo, trauma)
            writer.writerow([weight, npo, trauma] + [f"{x:.1f}" for x in res])

        # 3. Edge Cases
        # Boundary 20kg
        res_20 = calculate_intraop_reference(20, 6, 4)
        writer.writerow([20, 6, 4] + [f"{x:.1f}" for x in res_20])
        
        # Max reasonable weight
        res_max = calculate_intraop_reference(200, 10, 8)
        writer.writerow([200, 10, 8] + [f"{x:.1f}" for x in res_max])

    print(f"Generated {n} verification cases in {filename}")

if __name__ == "__main__":
    generate_golden_dataset()
