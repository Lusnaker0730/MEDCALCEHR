// Taiwan Pediatric Growth Reference Data
// Source: 衛生福利部國民健康署 (Health Promotion Administration, Ministry of Health and Welfare)
// Age range: Birth to 17 years, both sexes

/**
 * Taiwan growth percentile data point
 * Percentiles: 3rd, 15th, 25th, 50th, 75th, 85th, 97th
 */
export interface TaiwanPercentileDataPoint {
    Agemos: number;
    P3: number;
    P15: number;
    P25: number;
    P50: number;
    P75: number;
    P85: number;
    P97: number;
    // Optional LMS parameters (not available in Taiwan data, kept for compatibility)
    L?: number;
    M?: number;
    S?: number;
}

/**
 * Taiwan BMI threshold data point
 * Uses clinical cut-off values rather than percentiles
 */
export interface BmiThresholdPoint {
    Agemos: number;
    underweight: number; // BMI < this = 過輕 (underweight)
    overweight: number;  // BMI >= this = 過重 (overweight)
    obese: number;       // BMI >= this = 肥胖 (obese)
}

/**
 * Taiwan growth data structure
 */
export interface TaiwanGrowthData {
    weight: {
        male: TaiwanPercentileDataPoint[];
        female: TaiwanPercentileDataPoint[];
    };
    height: {
        male: TaiwanPercentileDataPoint[];
        female: TaiwanPercentileDataPoint[];
    };
    bmi: {
        male: BmiThresholdPoint[];
        female: BmiThresholdPoint[];
    };
}

export const taiwanData: TaiwanGrowthData = {
    weight: {
        male: [
            { Agemos: 0, P3: 2.5, P15: 2.9, P25: 3.0, P50: 3.3, P75: 3.7, P85: 3.9, P97: 4.3 },
            { Agemos: 6, P3: 6.4, P15: 7.1, P25: 7.4, P50: 7.9, P75: 8.5, P85: 8.9, P97: 9.7 },
            { Agemos: 12, P3: 7.8, P15: 8.6, P25: 9.0, P50: 9.6, P75: 10.4, P85: 10.8, P97: 11.8 },
            { Agemos: 18, P3: 8.9, P15: 9.7, P25: 10.1, P50: 10.9, P75: 11.8, P85: 12.3, P97: 13.5 },
            { Agemos: 24, P3: 9.8, P15: 10.8, P25: 11.3, P50: 12.2, P75: 13.1, P85: 13.7, P97: 15.1 },
            { Agemos: 30, P3: 10.7, P15: 11.8, P25: 12.3, P50: 13.3, P75: 14.4, P85: 15.0, P97: 16.6 },
            { Agemos: 36, P3: 11.4, P15: 12.7, P25: 13.2, P50: 14.3, P75: 15.6, P85: 16.3, P97: 18.0 },
            { Agemos: 42, P3: 12.2, P15: 13.5, P25: 14.1, P50: 15.3, P75: 16.7, P85: 17.5, P97: 19.4 },
            { Agemos: 48, P3: 12.9, P15: 14.3, P25: 15.0, P50: 16.3, P75: 17.8, P85: 18.7, P97: 20.9 },
            { Agemos: 54, P3: 13.6, P15: 15.2, P25: 15.9, P50: 17.3, P75: 19.0, P85: 19.9, P97: 22.3 },
            { Agemos: 60, P3: 14.3, P15: 16.0, P25: 16.7, P50: 18.3, P75: 20.1, P85: 21.1, P97: 23.8 },
            { Agemos: 66, P3: 15.3, P15: 17.1, P25: 17.9, P50: 19.6, P75: 21.6, P85: 22.9, P97: 26.5 },
            { Agemos: 72, P3: 16.3, P15: 18.2, P25: 19.0, P50: 20.9, P75: 23.2, P85: 24.7, P97: 29.2 },
            { Agemos: 78, P3: 17.4, P15: 19.3, P25: 20.2, P50: 22.3, P75: 24.7, P85: 26.4, P97: 32.0 },
            { Agemos: 84, P3: 18.4, P15: 20.4, P25: 21.3, P50: 23.6, P75: 26.3, P85: 28.2, P97: 34.7 },
            { Agemos: 96, P3: 20.3, P15: 22.7, P25: 23.8, P50: 26.3, P75: 29.6, P85: 32.2, P97: 40.2 },
            { Agemos: 108, P3: 22.1, P15: 24.8, P25: 26.0, P50: 28.8, P75: 32.7, P85: 35.7, P97: 44.3 },
            { Agemos: 120, P3: 24.0, P15: 26.9, P25: 28.4, P50: 31.5, P75: 36.0, P85: 39.4, P97: 48.6 },
            { Agemos: 132, P3: 26.3, P15: 29.6, P25: 31.4, P50: 35.3, P75: 40.8, P85: 44.7, P97: 54.8 },
            { Agemos: 144, P3: 29.3, P15: 33.1, P25: 35.2, P50: 40.3, P75: 46.5, P85: 50.4, P97: 61.5 },
            { Agemos: 156, P3: 32.8, P15: 38.0, P25: 40.7, P50: 46.5, P75: 53.0, P85: 56.8, P97: 68.5 },
            { Agemos: 168, P3: 38.0, P15: 44.0, P25: 46.8, P50: 52.5, P75: 58.7, P85: 62.7, P97: 74.3 },
            { Agemos: 180, P3: 43.0, P15: 49.0, P25: 51.3, P50: 56.5, P75: 62.5, P85: 66.5, P97: 77.6 },
            { Agemos: 192, P3: 46.8, P15: 52.0, P25: 54.1, P50: 59.0, P75: 65.0, P85: 69.0, P97: 79.3 },
            { Agemos: 204, P3: 49.3, P15: 54.0, P25: 56.1, P50: 61.0, P75: 66.6, P85: 70.0, P97: 80.0 }
        ],
        female: [
            { Agemos: 0, P3: 2.4, P15: 2.8, P25: 2.9, P50: 3.2, P75: 3.6, P85: 3.7, P97: 4.2 },
            { Agemos: 6, P3: 5.8, P15: 6.4, P25: 6.7, P50: 7.3, P75: 7.9, P85: 8.3, P97: 9.2 },
            { Agemos: 12, P3: 7.1, P15: 7.9, P25: 8.2, P50: 8.9, P75: 9.7, P85: 10.2, P97: 11.3 },
            { Agemos: 18, P3: 8.2, P15: 9.0, P25: 9.4, P50: 10.2, P75: 11.1, P85: 11.6, P97: 13.0 },
            { Agemos: 24, P3: 9.2, P15: 10.1, P25: 10.6, P50: 11.5, P75: 12.5, P85: 13.1, P97: 14.6 },
            { Agemos: 30, P3: 10.1, P15: 11.2, P25: 11.7, P50: 12.7, P75: 13.8, P85: 14.5, P97: 16.2 },
            { Agemos: 36, P3: 11.0, P15: 12.1, P25: 12.7, P50: 13.9, P75: 15.1, P85: 15.9, P97: 17.8 },
            { Agemos: 42, P3: 11.8, P15: 13.1, P25: 13.7, P50: 15.0, P75: 16.4, P85: 17.3, P97: 19.5 },
            { Agemos: 48, P3: 12.5, P15: 14.0, P25: 14.7, P50: 16.1, P75: 17.7, P85: 18.6, P97: 21.1 },
            { Agemos: 54, P3: 13.2, P15: 14.8, P25: 15.6, P50: 17.2, P75: 18.9, P85: 20.0, P97: 22.8 },
            { Agemos: 60, P3: 14.0, P15: 15.7, P25: 16.5, P50: 18.2, P75: 20.2, P85: 21.3, P97: 24.4 },
            { Agemos: 66, P3: 14.9, P15: 16.7, P25: 17.5, P50: 19.4, P75: 21.5, P85: 22.7, P97: 26.5 },
            { Agemos: 72, P3: 15.9, P15: 17.7, P25: 18.5, P50: 20.5, P75: 22.8, P85: 24.2, P97: 28.6 },
            { Agemos: 78, P3: 16.8, P15: 18.6, P25: 19.6, P50: 21.7, P75: 24.0, P85: 25.6, P97: 30.8 },
            { Agemos: 84, P3: 17.8, P15: 19.6, P25: 20.6, P50: 22.8, P75: 25.3, P85: 27.1, P97: 32.9 },
            { Agemos: 96, P3: 19.6, P15: 21.8, P25: 22.8, P50: 25.4, P75: 28.4, P85: 30.8, P97: 37.8 },
            { Agemos: 108, P3: 21.5, P15: 24.0, P25: 25.3, P50: 28.2, P75: 32.1, P85: 35.0, P97: 42.8 },
            { Agemos: 120, P3: 23.8, P15: 26.6, P25: 28.3, P50: 31.8, P75: 36.7, P85: 39.8, P97: 47.3 },
            { Agemos: 132, P3: 26.5, P15: 30.3, P25: 32.5, P50: 36.9, P75: 42.2, P85: 45.5, P97: 52.7 },
            { Agemos: 144, P3: 29.8, P15: 34.8, P25: 37.1, P50: 41.7, P75: 47.0, P85: 50.1, P97: 57.8 },
            { Agemos: 156, P3: 33.5, P15: 38.7, P25: 40.9, P50: 45.4, P75: 50.5, P85: 53.5, P97: 61.2 },
            { Agemos: 168, P3: 37.1, P15: 41.7, P25: 43.8, P50: 48.1, P75: 53.0, P85: 56.0, P97: 63.9 },
            { Agemos: 180, P3: 39.3, P15: 43.8, P25: 45.7, P50: 49.6, P75: 54.5, P85: 57.5, P97: 65.5 },
            { Agemos: 192, P3: 40.5, P15: 44.8, P25: 46.7, P50: 50.5, P75: 55.0, P85: 58.0, P97: 66.2 },
            { Agemos: 204, P3: 41.5, P15: 45.2, P25: 47.2, P50: 51.0, P75: 55.0, P85: 58.0, P97: 66.7 }
        ]
    },
    height: {
        male: [
            { Agemos: 0, P3: 46.3, P15: 47.9, P25: 48.6, P50: 49.9, P75: 51.2, P85: 51.8, P97: 53.4 },
            { Agemos: 6, P3: 63.6, P15: 65.4, P25: 66.2, P50: 67.6, P75: 69.1, P85: 69.8, P97: 71.6 },
            { Agemos: 12, P3: 71.3, P15: 73.3, P25: 74.1, P50: 75.7, P75: 77.4, P85: 78.2, P97: 80.2 },
            { Agemos: 18, P3: 77.2, P15: 79.5, P25: 80.4, P50: 82.3, P75: 84.1, P85: 85.1, P97: 87.3 },
            { Agemos: 24, P3: 82.1, P15: 84.6, P25: 85.8, P50: 87.8, P75: 89.9, P85: 91.0, P97: 93.6 },
            { Agemos: 30, P3: 85.5, P15: 88.4, P25: 89.6, P50: 91.9, P75: 94.2, P85: 95.5, P97: 98.3 },
            { Agemos: 36, P3: 89.1, P15: 92.2, P25: 93.6, P50: 96.1, P75: 98.6, P85: 99.9, P97: 103.1 },
            { Agemos: 42, P3: 92.4, P15: 95.7, P25: 97.2, P50: 99.9, P75: 102.5, P85: 104.0, P97: 107.3 },
            { Agemos: 48, P3: 95.4, P15: 99.0, P25: 100.5, P50: 103.5, P75: 106.2, P85: 107.7, P97: 111.2 },
            { Agemos: 54, P3: 98.4, P15: 102.1, P25: 103.7, P50: 106.7, P75: 109.6, P85: 111.2, P97: 115.0 },
            { Agemos: 60, P3: 101.2, P15: 105.2, P25: 106.8, P50: 110.0, P75: 113.1, P85: 114.8, P97: 118.7 },
            { Agemos: 66, P3: 103.9, P15: 107.9, P25: 109.5, P50: 112.8, P75: 116.0, P85: 117.7, P97: 121.8 },
            { Agemos: 72, P3: 106.5, P15: 110.5, P25: 112.3, P50: 115.6, P75: 118.9, P85: 120.6, P97: 124.9 },
            { Agemos: 78, P3: 109.2, P15: 113.2, P25: 115.0, P50: 118.4, P75: 121.7, P85: 123.6, P97: 128.1 },
            { Agemos: 84, P3: 111.8, P15: 115.8, P25: 117.8, P50: 121.2, P75: 124.6, P85: 126.5, P97: 131.2 },
            { Agemos: 96, P3: 117.0, P15: 121.3, P25: 123.3, P50: 126.8, P75: 130.3, P85: 132.2, P97: 137.2 },
            { Agemos: 108, P3: 121.8, P15: 126.0, P25: 128.0, P50: 131.8, P75: 135.5, P85: 137.5, P97: 142.5 },
            { Agemos: 120, P3: 126.0, P15: 130.5, P25: 132.5, P50: 136.5, P75: 140.5, P85: 142.8, P97: 148.3 },
            { Agemos: 132, P3: 130.5, P15: 135.6, P25: 137.8, P50: 142.0, P75: 146.7, P85: 149.4, P97: 156.1 },
            { Agemos: 144, P3: 135.6, P15: 141.1, P25: 143.8, P50: 148.8, P75: 154.2, P85: 157.1, P97: 164.4 },
            { Agemos: 156, P3: 141.9, P15: 148.5, P25: 151.5, P50: 156.9, P75: 162.0, P85: 164.9, P97: 171.0 },
            { Agemos: 168, P3: 149.3, P15: 156.3, P25: 159.0, P50: 163.7, P75: 168.3, P85: 170.8, P97: 176.0 },
            { Agemos: 180, P3: 155.5, P15: 161.3, P25: 163.5, P50: 167.6, P75: 171.8, P85: 173.9, P97: 179.0 },
            { Agemos: 192, P3: 159.3, P15: 164.0, P25: 166.2, P50: 170.0, P75: 173.8, P85: 175.8, P97: 180.5 },
            { Agemos: 204, P3: 160.9, P15: 165.5, P25: 167.7, P50: 171.5, P75: 174.8, P85: 176.8, P97: 181.5 }
        ],
        female: [
            { Agemos: 0, P3: 45.6, P15: 47.2, P25: 47.9, P50: 49.1, P75: 50.4, P85: 51.1, P97: 52.7 },
            { Agemos: 6, P3: 61.5, P15: 63.4, P25: 64.2, P50: 65.7, P75: 67.3, P85: 68.1, P97: 70.0 },
            { Agemos: 12, P3: 69.2, P15: 71.3, P25: 72.3, P50: 74.0, P75: 75.8, P85: 76.7, P97: 78.9 },
            { Agemos: 18, P3: 75.2, P15: 77.7, P25: 78.7, P50: 80.7, P75: 82.7, P85: 83.7, P97: 86.2 },
            { Agemos: 24, P3: 80.3, P15: 83.1, P25: 84.2, P50: 86.4, P75: 88.6, P85: 89.8, P97: 92.5 },
            { Agemos: 30, P3: 84.0, P15: 87.0, P25: 88.3, P50: 90.7, P75: 93.1, P85: 94.3, P97: 97.3 },
            { Agemos: 36, P3: 87.9, P15: 91.1, P25: 92.5, P50: 95.1, P75: 97.6, P85: 99.0, P97: 102.2 },
            { Agemos: 42, P3: 91.4, P15: 94.8, P25: 96.3, P50: 99.0, P75: 101.8, P85: 103.3, P97: 106.7 },
            { Agemos: 48, P3: 94.6, P15: 98.3, P25: 99.8, P50: 102.7, P75: 105.6, P85: 107.2, P97: 110.8 },
            { Agemos: 54, P3: 97.6, P15: 101.5, P25: 103.1, P50: 106.2, P75: 109.2, P85: 110.9, P97: 114.7 },
            { Agemos: 60, P3: 100.5, P15: 104.5, P25: 106.2, P50: 109.4, P75: 112.6, P85: 114.4, P97: 118.4 },
            { Agemos: 66, P3: 103.0, P15: 107.1, P25: 108.8, P50: 112.1, P75: 115.3, P85: 117.1, P97: 121.3 },
            { Agemos: 72, P3: 105.5, P15: 109.7, P25: 111.3, P50: 114.8, P75: 118.0, P85: 119.9, P97: 124.2 },
            { Agemos: 78, P3: 108.1, P15: 112.3, P25: 113.9, P50: 117.6, P75: 120.8, P85: 122.6, P97: 127.2 },
            { Agemos: 84, P3: 110.6, P15: 114.9, P25: 116.4, P50: 120.3, P75: 123.5, P85: 125.4, P97: 130.1 },
            { Agemos: 96, P3: 115.7, P15: 120.3, P25: 122.0, P50: 125.8, P75: 129.2, P85: 131.3, P97: 136.5 },
            { Agemos: 108, P3: 120.7, P15: 125.5, P25: 127.5, P50: 131.3, P75: 135.4, P85: 137.8, P97: 143.5 },
            { Agemos: 120, P3: 125.8, P15: 131.0, P25: 133.0, P50: 137.5, P75: 142.3, P85: 144.8, P97: 150.8 },
            { Agemos: 132, P3: 131.8, P15: 137.5, P25: 139.8, P50: 144.5, P75: 149.4, P85: 151.8, P97: 157.3 },
            { Agemos: 144, P3: 137.9, P15: 143.8, P25: 146.3, P50: 150.5, P75: 154.9, P85: 157.0, P97: 161.8 },
            { Agemos: 156, P3: 143.2, P15: 148.5, P25: 150.7, P50: 154.5, P75: 158.4, P85: 160.3, P97: 164.8 },
            { Agemos: 168, P3: 146.8, P15: 151.3, P25: 153.2, P50: 156.8, P75: 160.4, P85: 162.3, P97: 167.0 },
            { Agemos: 180, P3: 148.5, P15: 152.5, P25: 154.5, P50: 157.9, P75: 161.5, P85: 163.5, P97: 168.2 },
            { Agemos: 192, P3: 149.5, P15: 153.5, P25: 155.3, P50: 158.7, P75: 162.3, P85: 164.2, P97: 168.8 },
            { Agemos: 204, P3: 150.0, P15: 154.0, P25: 155.8, P50: 159.3, P75: 162.8, P85: 164.7, P97: 169.0 }
        ]
    },
    bmi: {
        male: [
            { Agemos: 24, underweight: 14.2, overweight: 17.4, obese: 18.3 },
            { Agemos: 30, underweight: 13.9, overweight: 17.2, obese: 18.0 },
            { Agemos: 36, underweight: 13.7, overweight: 17.0, obese: 17.8 },
            { Agemos: 42, underweight: 13.6, overweight: 16.8, obese: 17.7 },
            { Agemos: 48, underweight: 13.4, overweight: 16.7, obese: 17.6 },
            { Agemos: 54, underweight: 13.3, overweight: 16.7, obese: 17.6 },
            { Agemos: 60, underweight: 13.3, overweight: 16.7, obese: 17.7 },
            { Agemos: 66, underweight: 13.4, overweight: 16.7, obese: 18.0 },
            { Agemos: 72, underweight: 13.5, overweight: 16.9, obese: 18.5 },
            { Agemos: 78, underweight: 13.6, overweight: 17.3, obese: 19.2 },
            { Agemos: 84, underweight: 13.8, overweight: 17.9, obese: 20.3 },
            { Agemos: 96, underweight: 14.1, overweight: 19.0, obese: 21.6 },
            { Agemos: 108, underweight: 14.3, overweight: 19.5, obese: 22.3 },
            { Agemos: 120, underweight: 14.5, overweight: 20.0, obese: 22.7 },
            { Agemos: 132, underweight: 14.8, overweight: 20.7, obese: 23.2 },
            { Agemos: 144, underweight: 15.2, overweight: 21.3, obese: 23.9 },
            { Agemos: 156, underweight: 15.7, overweight: 21.9, obese: 24.5 },
            { Agemos: 168, underweight: 16.3, overweight: 22.5, obese: 25.0 },
            { Agemos: 180, underweight: 16.9, overweight: 22.9, obese: 25.4 },
            { Agemos: 192, underweight: 17.4, overweight: 23.3, obese: 25.6 },
            { Agemos: 204, underweight: 17.8, overweight: 23.5, obese: 25.6 }
        ],
        female: [
            { Agemos: 24, underweight: 13.7, overweight: 17.2, obese: 18.1 },
            { Agemos: 30, underweight: 13.6, overweight: 17.0, obese: 17.9 },
            { Agemos: 36, underweight: 13.5, overweight: 16.9, obese: 17.8 },
            { Agemos: 42, underweight: 13.3, overweight: 16.8, obese: 17.8 },
            { Agemos: 48, underweight: 13.2, overweight: 16.8, obese: 17.9 },
            { Agemos: 54, underweight: 13.1, overweight: 16.9, obese: 18.0 },
            { Agemos: 60, underweight: 13.1, overweight: 17.0, obese: 18.1 },
            { Agemos: 66, underweight: 13.1, overweight: 17.0, obese: 18.3 },
            { Agemos: 72, underweight: 13.1, overweight: 17.2, obese: 18.8 },
            { Agemos: 78, underweight: 13.2, overweight: 17.5, obese: 19.2 },
            { Agemos: 84, underweight: 13.4, overweight: 17.7, obese: 19.6 },
            { Agemos: 96, underweight: 13.8, overweight: 18.4, obese: 20.7 },
            { Agemos: 108, underweight: 14.0, overweight: 19.1, obese: 21.3 },
            { Agemos: 120, underweight: 14.3, overweight: 19.7, obese: 22.0 },
            { Agemos: 132, underweight: 14.7, overweight: 20.5, obese: 22.7 },
            { Agemos: 144, underweight: 15.2, overweight: 21.3, obese: 23.5 },
            { Agemos: 156, underweight: 15.7, overweight: 21.9, obese: 24.3 },
            { Agemos: 168, underweight: 16.3, overweight: 22.5, obese: 24.9 },
            { Agemos: 180, underweight: 16.7, overweight: 22.7, obese: 25.2 },
            { Agemos: 192, underweight: 17.1, overweight: 22.7, obese: 25.3 },
            { Agemos: 204, underweight: 17.3, overweight: 22.7, obese: 25.3 }
        ]
    }
};
