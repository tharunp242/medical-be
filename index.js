require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const shouldSeedOnStart = process.env.SEED_ON_START === 'true';
const shouldResetOnSeed = process.env.RESET_DB_ON_SEED === 'true';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Database Connection
const connectDatabase = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
};

// Initial Stock Seeding (Optional/Demo)
const Product = require('./models/Product');
const seedProducts = async () => {
    if (shouldResetOnSeed) {
        await Product.deleteMany({});
    }

    const medicines = [
        // 1. Pain Relief & Fever (15)
        { name: 'Paracetamol', category: 'Pain Relief', price: 10, stock: 500, dosage: '500mg', requiresPrescription: false },
        { name: 'Ibuprofen', category: 'Pain Relief', price: 12, stock: 450, dosage: '200mg', requiresPrescription: false },
        { name: 'Aspirin', category: 'Pain Relief', price: 8, stock: 300, dosage: '300mg', requiresPrescription: false },
        { name: 'Naproxen', category: 'Pain Relief', price: 22, stock: 150, dosage: '250mg', requiresPrescription: true },
        { name: 'Diclofenac', category: 'Pain Relief', price: 18, stock: 200, dosage: '50mg', requiresPrescription: true },
        { name: 'Tramadol', category: 'Pain Relief', price: 85, stock: 40, dosage: '50mg', requiresPrescription: true },
        { name: 'Mefenamic Acid', category: 'Pain Relief', price: 20, stock: 180, dosage: '250mg', requiresPrescription: false },
        { name: 'Aceclofenac', category: 'Pain Relief', price: 24, stock: 160, dosage: '100mg', requiresPrescription: true },
        { name: 'Etoricoxib', category: 'Pain Relief', price: 45, stock: 90, dosage: '90mg', requiresPrescription: true },
        { name: 'Ketorolac', category: 'Pain Relief', price: 35, stock: 70, dosage: '10mg', requiresPrescription: true },
        { name: 'Sumatriptan', category: 'Pain Relief', price: 120, stock: 30, dosage: '50mg', requiresPrescription: true },
        { name: 'Celecoxib', category: 'Pain Relief', price: 95, stock: 45, dosage: '200mg', requiresPrescription: true },
        { name: 'Piroxicam', category: 'Pain Relief', price: 28, stock: 110, dosage: '20mg', requiresPrescription: true },
        { name: 'Nimesulide', category: 'Pain Relief', price: 15, stock: 250, dosage: '100mg', requiresPrescription: false },
        { name: 'Pregabalin', category: 'Pain Relief', price: 110, stock: 55, dosage: '75mg', requiresPrescription: true },

        // 2. Antibiotics & Anti-infectives (20)
        { name: 'Amoxicillin', category: 'Antibiotic', price: 25, stock: 400, dosage: '250mg', requiresPrescription: true },
        { name: 'Azithromycin', category: 'Antibiotic', price: 30, stock: 350, dosage: '500mg', requiresPrescription: true },
        { name: 'Ciprofloxacin', category: 'Antibiotic', price: 45, stock: 200, dosage: '500mg', requiresPrescription: true },
        { name: 'Doxycycline', category: 'Antibiotic', price: 35, stock: 150, dosage: '100mg', requiresPrescription: true },
        { name: 'Cephalexin', category: 'Antibiotic', price: 40, stock: 120, dosage: '500mg', requiresPrescription: true },
        { name: 'Metronidazole', category: 'Antibiotic', price: 28, stock: 250, dosage: '400mg', requiresPrescription: true },
        { name: 'Clindamycin', category: 'Antibiotic', price: 110, stock: 60, dosage: '300mg', requiresPrescription: true },
        { name: 'Clarithromycin', category: 'Antibiotic', price: 150, stock: 45, dosage: '500mg', requiresPrescription: true },
        { name: 'Levofloxacin', category: 'Antibiotic', price: 90, stock: 80, dosage: '500mg', requiresPrescription: true },
        { name: 'Ofloxacin', category: 'Antibiotic', price: 55, stock: 140, dosage: '200mg', requiresPrescription: true },
        { name: 'Sulfamethoxazole', category: 'Antibiotic', price: 38, stock: 100, dosage: '800mg', requiresPrescription: true },
        { name: 'Nitrofurantoin', category: 'Antibiotic', price: 120, stock: 50, dosage: '100mg', requiresPrescription: true },
        { name: 'Fluconazole', category: 'Anti-fungal', price: 45, stock: 130, dosage: '150mg', requiresPrescription: true },
        { name: 'Terbinafine', category: 'Anti-fungal', price: 140, stock: 40, dosage: '250mg', requiresPrescription: true },
        { name: 'Albendazole', category: 'Anti-parasitic', price: 25, stock: 200, dosage: '400mg', requiresPrescription: false },
        { name: 'Ivermectin', category: 'Anti-parasitic', price: 50, stock: 90, dosage: '6mg', requiresPrescription: true },
        { name: 'Acyclovir', category: 'Anti-viral', price: 65, stock: 110, dosage: '400mg', requiresPrescription: true },
        { name: 'Oseltamivir', category: 'Anti-viral', price: 450, stock: 30, dosage: '75mg', requiresPrescription: true },
        { name: 'Erythromycin', category: 'Antibiotic', price: 48, stock: 120, dosage: '250mg', requiresPrescription: true },
        { name: 'Minocycline', category: 'Antibiotic', price: 180, stock: 35, dosage: '100mg', requiresPrescription: true },

        // 3. Respiratory & Allergy (15)
        { name: 'Cetirizine', category: 'Allergy', price: 15, stock: 500, dosage: '10mg', requiresPrescription: false },
        { name: 'Loratadine', category: 'Allergy', price: 18, stock: 400, dosage: '10mg', requiresPrescription: false },
        { name: 'Fexofenadine', category: 'Allergy', price: 35, stock: 250, dosage: '120mg', requiresPrescription: false },
        { name: 'Montelukast', category: 'Asthma', price: 48, stock: 180, dosage: '10mg', requiresPrescription: true },
        { name: 'Salbutamol Inhaler', category: 'Asthma', price: 150, stock: 100, dosage: '100mcg', requiresPrescription: true },
        { name: 'Fluticasone Spray', category: 'Allergy', price: 220, stock: 60, dosage: '50mcg', requiresPrescription: true },
        { name: 'Levocetirizine', category: 'Allergy', price: 28, stock: 300, dosage: '5mg', requiresPrescription: false },
        { name: 'Dextromethorphan Syrup', category: 'Cough', price: 85, stock: 150, dosage: '100ml', requiresPrescription: false },
        { name: 'Guaifenesin', category: 'Cough', price: 65, stock: 180, dosage: '200mg', requiresPrescription: false },
        { name: 'Ambroxol', category: 'Cough', price: 45, stock: 220, dosage: '30mg', requiresPrescription: false },
        { name: 'Budeconide Inhaler', category: 'Asthma', price: 350, stock: 45, dosage: '200mcg', requiresPrescription: true },
        { name: 'Bromhexine', category: 'Cough', price: 55, stock: 130, dosage: '8mg', requiresPrescription: false },
        { name: 'Phenylephrine', category: 'Cold', price: 22, stock: 240, dosage: '10mg', requiresPrescription: false },
        { name: 'Chlorpheniramine', category: 'Allergy', price: 8, stock: 400, dosage: '4mg', requiresPrescription: false },
        { name: 'Hydroxyzine', category: 'Allergy', price: 45, stock: 120, dosage: '25mg', requiresPrescription: true },

        // 4. Diabetes & Chronic Care (20)
        { name: 'Metformin', category: 'Diabetes', price: 40, stock: 600, dosage: '500mg', requiresPrescription: true },
        { name: 'Glimepiride', category: 'Diabetes', price: 35, stock: 400, dosage: '2mg', requiresPrescription: true },
        { name: 'Sitagliptin', category: 'Diabetes', price: 150, stock: 150, dosage: '50mg', requiresPrescription: true },
        { name: 'Dapagliflozin', category: 'Diabetes', price: 280, stock: 80, dosage: '10mg', requiresPrescription: true },
        { name: 'Vildagliptin', category: 'Diabetes', price: 120, stock: 120, dosage: '50mg', requiresPrescription: true },
        { name: 'Pioglitazone', category: 'Diabetes', price: 75, stock: 100, dosage: '15mg', requiresPrescription: true },
        { name: 'Teneligliptin', category: 'Diabetes', price: 95, stock: 130, dosage: '20mg', requiresPrescription: true },
        { name: 'Gliclazide', category: 'Diabetes', price: 65, stock: 180, dosage: '80mg', requiresPrescription: true },
        { name: 'Atorvastatin', category: 'Cholesterol', price: 55, stock: 450, dosage: '20mg', requiresPrescription: true },
        { name: 'Rosuvastatin', category: 'Cholesterol', price: 85, stock: 300, dosage: '10mg', requiresPrescription: true },
        { name: 'Fenofibrate', category: 'Cholesterol', price: 110, stock: 140, dosage: '160mg', requiresPrescription: true },
        { name: 'Ezetimibe', category: 'Cholesterol', price: 140, stock: 85, dosage: '10mg', requiresPrescription: true },
        { name: 'Lisinopril', category: 'Blood Pressure', price: 35, stock: 250, dosage: '10mg', requiresPrescription: true },
        { name: 'Amlodipine', category: 'Blood Pressure', price: 25, stock: 500, dosage: '5mg', requiresPrescription: true },
        { name: 'Losartan', category: 'Blood Pressure', price: 45, stock: 350, dosage: '50mg', requiresPrescription: true },
        { name: 'Telmisartan', category: 'Blood Pressure', price: 60, stock: 380, dosage: '40mg', requiresPrescription: true },
        { name: 'Enalapril', category: 'Blood Pressure', price: 30, stock: 200, dosage: '5mg', requiresPrescription: true },
        { name: 'Ramipril', category: 'Blood Pressure', price: 55, stock: 180, dosage: '5mg', requiresPrescription: true },
        { name: 'Metoprolol', category: 'Blood Pressure', price: 48, stock: 220, dosage: '50mg', requiresPrescription: true },
        { name: 'Bisoprolol', category: 'Blood Pressure', price: 75, stock: 140, dosage: '5mg', requiresPrescription: true },

        // 5. Cardiac & Blood (15)
        { name: 'Warfarin', category: 'Cardiac', price: 120, stock: 60, dosage: '5mg', requiresPrescription: true },
        { name: 'Clopidogrel', category: 'Cardiac', price: 85, stock: 200, dosage: '75mg', requiresPrescription: true },
        { name: 'Aspirin Low Dose', category: 'Cardiac', price: 15, stock: 500, dosage: '75mg', requiresPrescription: false },
        { name: 'Digoxin', category: 'Cardiac', price: 95, stock: 80, dosage: '0.25mg', requiresPrescription: true },
        { name: 'Isosorbide Dinitrate', category: 'Cardiac', price: 55, stock: 120, dosage: '10mg', requiresPrescription: true },
        { name: 'Nitroglycerin Spray', category: 'Cardiac', price: 650, stock: 30, dosage: '0.4mg', requiresPrescription: true },
        { name: 'Furosemide', category: 'Cardiac', price: 22, stock: 300, dosage: '40mg', requiresPrescription: true },
        { name: 'Spironolactone', category: 'Cardiac', price: 45, stock: 150, dosage: '25mg', requiresPrescription: true },
        { name: 'Amiodarone', category: 'Cardiac', price: 180, stock: 40, dosage: '200mg', requiresPrescription: true },
        { name: 'Rivaroxaban', category: 'Cardiac', price: 550, stock: 50, dosage: '20mg', requiresPrescription: true },
        { name: 'Apixaban', category: 'Cardiac', price: 620, stock: 45, dosage: '5mg', requiresPrescription: true },
        { name: 'Dabigatran', category: 'Cardiac', price: 580, stock: 35, dosage: '110mg', requiresPrescription: true },
        { name: 'Torsemide', category: 'Cardiac', price: 65, stock: 100, dosage: '10mg', requiresPrescription: true },
        { name: 'Chlorthalidone', category: 'Cardiac', price: 40, stock: 130, dosage: '12.5mg', requiresPrescription: true },
        { name: 'Hydrochlorothiazide', category: 'Cardiac', price: 18, stock: 250, dosage: '12.5mg', requiresPrescription: true },

        // 6. Digestive & Stomach (15)
        { name: 'Omeprazole', category: 'Digestive', price: 22, stock: 450, dosage: '20mg', requiresPrescription: false },
        { name: 'Pantoprazole', category: 'Digestive', price: 35, stock: 400, dosage: '40mg', requiresPrescription: false },
        { name: 'Ranitidine', category: 'Digestive', price: 15, stock: 350, dosage: '150mg', requiresPrescription: false },
        { name: 'Domperidone', category: 'Digestive', price: 28, stock: 300, dosage: '10mg', requiresPrescription: false },
        { name: 'Ondansetron', category: 'Digestive', price: 45, stock: 150, dosage: '4mg', requiresPrescription: true },
        { name: 'Loperamide', category: 'Digestive', price: 20, stock: 200, dosage: '2mg', requiresPrescription: false },
        { name: 'Bisacodyl', category: 'Digestive', price: 12, stock: 250, dosage: '5mg', requiresPrescription: false },
        { name: 'Oral Rehydration Salts', category: 'Digestive', price: 8, stock: 500, dosage: 'Sachet', requiresPrescription: false },
        { name: 'Antacid Gel', category: 'Digestive', price: 95, stock: 120, dosage: '200ml', requiresPrescription: false },
        { name: 'Activated Charcoal', category: 'Digestive', price: 55, stock: 100, dosage: '250mg', requiresPrescription: false },
        { name: 'Sucralfate Syrup', category: 'Digestive', price: 180, stock: 60, dosage: '200ml', requiresPrescription: true },
        { name: 'Mebeverine', category: 'Digestive', price: 65, stock: 110, dosage: '135mg', requiresPrescription: true },
        { name: 'Lactulose Syrup', category: 'Digestive', price: 240, stock: 80, dosage: '200ml', requiresPrescription: false },
        { name: 'Digene Tablets', category: 'Digestive', price: 18, stock: 400, dosage: 'Chewable', requiresPrescription: false },
        { name: 'Esomeprazole', category: 'Digestive', price: 55, stock: 200, dosage: '40mg', requiresPrescription: true },

        // 7. Mental Health & Neurology (15)
        { name: 'Sertraline', category: 'Mental Health', price: 65, stock: 150, dosage: '50mg', requiresPrescription: true },
        { name: 'Fluoxetine', category: 'Mental Health', price: 55, stock: 120, dosage: '20mg', requiresPrescription: true },
        { name: 'Escitalopram', category: 'Mental Health', price: 45, stock: 200, dosage: '10mg', requiresPrescription: true },
        { name: 'Alprazolam', category: 'Mental Health', price: 150, stock: 50, dosage: '0.5mg', requiresPrescription: true },
        { name: 'Diazepam', category: 'Mental Health', price: 120, stock: 40, dosage: '5mg', requiresPrescription: true },
        { name: 'Lorazepam', category: 'Mental Health', price: 110, stock: 60, dosage: '2mg', requiresPrescription: true },
        { name: 'Amitriptyline', category: 'Mental Health', price: 35, stock: 180, dosage: '25mg', requiresPrescription: true },
        { name: 'Gabapentin', category: 'Mental Health', price: 95, stock: 110, dosage: '300mg', requiresPrescription: true },
        { name: 'Methylphenidate', category: 'Mental Health', price: 350, stock: 30, dosage: '10mg', requiresPrescription: true },
        { name: 'Quetiapine', category: 'Mental Health', price: 180, stock: 55, dosage: '100mg', requiresPrescription: true },
        { name: 'Olanzapine', category: 'Mental Health', price: 90, stock: 90, dosage: '5mg', requiresPrescription: true },
        { name: 'Levetiracetam', category: 'Neurology', price: 220, stock: 70, dosage: '500mg', requiresPrescription: true },
        { name: 'Valproate Sodium', category: 'Neurology', price: 140, stock: 100, dosage: '500mg', requiresPrescription: true },
        { name: 'Donepezil', category: 'Neurology', price: 160, stock: 45, dosage: '5mg', requiresPrescription: true },
        { name: 'Memantine', category: 'Neurology', price: 195, stock: 35, dosage: '10mg', requiresPrescription: true },

        // 8. Skin & Dermatology (15)
        { name: 'Mupirocin Ointment', category: 'Dermatology', price: 180, stock: 100, dosage: '5g', requiresPrescription: true },
        { name: 'Clotrimazole Cream', category: 'Dermatology', price: 45, stock: 250, dosage: '15g', requiresPrescription: false },
        { name: 'Hydrocortisone Cream', category: 'Dermatology', price: 65, stock: 150, dosage: '10g', requiresPrescription: true },
        { name: 'Betamethasone', category: 'Dermatology', price: 35, stock: 200, dosage: '10g', requiresPrescription: true },
        { name: 'Ketoconazole Shampoo', category: 'Dermatology', price: 280, stock: 75, dosage: '100ml', requiresPrescription: false },
        { name: 'Salicylic Acid Gel', category: 'Dermatology', price: 120, stock: 110, dosage: '20g', requiresPrescription: false },
        { name: 'Benzoyl Peroxide', category: 'Dermatology', price: 150, stock: 90, dosage: '30g', requiresPrescription: false },
        { name: 'Adapalene Gel', category: 'Dermatology', price: 350, stock: 40, dosage: '15g', requiresPrescription: true },
        { name: 'Calamine Lotion', category: 'Dermatology', price: 95, stock: 180, dosage: '100ml', requiresPrescription: false },
        { name: 'Tretinoin Cream', category: 'Dermatology', price: 450, stock: 30, dosage: '20g', requiresPrescription: true },
        { name: 'Permethrin Lotion', category: 'Dermatology', price: 110, stock: 85, dosage: '60ml', requiresPrescription: true },
        { name: 'Mometasone Cream', category: 'Dermatology', price: 220, stock: 65, dosage: '10g', requiresPrescription: true },
        { name: 'Fusidic Acid', category: 'Dermatology', price: 140, stock: 120, dosage: '10g', requiresPrescription: true },
        { name: 'Diclofenac Gel', category: 'Dermatology', price: 85, stock: 250, dosage: '30g', requiresPrescription: false },
        { name: 'Aloe Vera Gel', category: 'Dermatology', price: 120, stock: 300, dosage: '150g', requiresPrescription: false },

        // 9. Vitamins & Supplements (15)
        { name: 'Vitamin C', category: 'Supplements', price: 25, stock: 500, dosage: '500mg', requiresPrescription: false },
        { name: 'Vitamin D3', category: 'Supplements', price: 45, stock: 400, dosage: '60k IU', requiresPrescription: false },
        { name: 'B-Complex', category: 'Supplements', price: 35, stock: 350, dosage: 'Daily', requiresPrescription: false },
        { name: 'Calcium + D3', category: 'Supplements', price: 120, stock: 200, dosage: '500mg', requiresPrescription: false },
        { name: 'Fish Oil Omega-3', category: 'Supplements', price: 450, stock: 120, dosage: '1000mg', requiresPrescription: false },
        { name: 'Iron Supplements', category: 'Supplements', price: 85, stock: 250, dosage: '100mg', requiresPrescription: false },
        { name: 'Zinc Acetate', category: 'Supplements', price: 45, stock: 300, dosage: '50mg', requiresPrescription: false },
        { name: 'Magnesium Citrate', category: 'Supplements', price: 350, stock: 90, dosage: '200mg', requiresPrescription: false },
        { name: 'Vitamin E Capsules', category: 'Supplements', price: 140, stock: 180, dosage: '400mg', requiresPrescription: false },
        { name: 'Folic Acid', category: 'Supplements', price: 20, stock: 450, dosage: '5mg', requiresPrescription: false },
        { name: 'Glucosamine', category: 'Supplements', price: 550, stock: 70, dosage: '750mg', requiresPrescription: false },
        { name: 'Probiotic Capsules', category: 'Supplements', price: 320, stock: 110, dosage: 'Bio-Live', requiresPrescription: false },
        { name: 'Biotin', category: 'Supplements', price: 280, stock: 140, dosage: '10mg', requiresPrescription: false },
        { name: 'Coenzyme Q10', category: 'Supplements', price: 750, stock: 45, dosage: '100mg', requiresPrescription: false },
        { name: 'Melatonin', category: 'Supplements', price: 180, stock: 130, dosage: '3mg', requiresPrescription: false },

        // 10. Eye, Ear & First Aid (10)
        { name: 'Ciprofloxacin Eye Drops', category: 'Eye/Ear', price: 45, stock: 120, dosage: '5ml', requiresPrescription: true },
        { name: 'Carboxymethylcellulose', category: 'Eye/Ear', price: 140, stock: 150, dosage: '10ml', requiresPrescription: false },
        { name: 'Wax Dissolver Drops', category: 'Eye/Ear', price: 85, stock: 90, dosage: '10ml', requiresPrescription: false },
        { name: 'Timolol Eye Drops', category: 'Eye/Ear', price: 120, stock: 65, dosage: '5ml', requiresPrescription: true },
        { name: 'Antiseptic Solution', category: 'First Aid', price: 65, stock: 300, dosage: '100ml', requiresPrescription: false },
        { name: 'Adhesive Bandages', category: 'First Aid', price: 35, stock: 500, dosage: 'Box of 20', requiresPrescription: false },
        { name: 'Cotton Roll', category: 'First Aid', price: 45, stock: 200, dosage: '100g', requiresPrescription: false },
        { name: 'Surgical Tape', category: 'First Aid', price: 25, stock: 180, dosage: '1 inch', requiresPrescription: false },
        { name: 'Thermometer Digital', category: 'First Aid', price: 220, stock: 100, dosage: 'Device', requiresPrescription: false },
        { name: 'Hand Sanitizer', category: 'First Aid', price: 55, stock: 400, dosage: '200ml', requiresPrescription: false },

        // 11. Personal Care & Soaps (15)
        { name: 'Chlorhexidine Soap', category: 'Personal Care', price: 120, stock: 150, dosage: '100g', requiresPrescription: false },
        { name: 'Medicated Sulfur Soap', category: 'Personal Care', price: 95, stock: 200, dosage: '75g', requiresPrescription: false },
        { name: 'Neem & Aloe Soap', category: 'Personal Care', price: 65, stock: 300, dosage: '125g', requiresPrescription: false },
        { name: 'Anti-Bacterial Body Wash', category: 'Personal Care', price: 280, stock: 120, dosage: '250ml', requiresPrescription: false },
        { name: 'Ketoconazole Soap', category: 'Personal Care', price: 180, stock: 80, dosage: '75g', requiresPrescription: true },
        { name: 'Moisturizing Cream Bar', category: 'Personal Care', price: 55, stock: 400, dosage: '100g', requiresPrescription: false },
        { name: 'Antiseptic Liquid Soap', category: 'Personal Care', price: 140, stock: 220, dosage: '200ml', requiresPrescription: false },
        { name: 'Sensitive Skin Cleanser', category: 'Personal Care', price: 350, stock: 90, dosage: '150ml', requiresPrescription: false },
        { name: 'Coal Tar Soap', category: 'Personal Care', price: 220, stock: 65, dosage: '75g', requiresPrescription: true },
        { name: 'Baby Mild Soap', category: 'Personal Care', price: 85, stock: 250, dosage: '100g', requiresPrescription: false },

        // 12. Ointments & Topicals (15)
        { name: 'Povidone Iodine Ointment', category: 'Ointments', price: 65, stock: 300, dosage: '15g', requiresPrescription: false },
        { name: 'Silver Sulfadiazine', category: 'Ointments', price: 120, stock: 150, dosage: '20g', requiresPrescription: true },
        { name: 'Triple Antibiotic Ointment', category: 'Ointments', price: 180, stock: 120, dosage: '10g', requiresPrescription: false },
        { name: 'Melt-Away Burn Gel', category: 'Ointments', price: 250, stock: 80, dosage: '30g', requiresPrescription: false },
        { name: 'Diclofenac Sodium Gel', category: 'Ointments', price: 45, stock: 400, dosage: '30g', requiresPrescription: false },
        { name: 'Hydrocortisone 1%', category: 'Ointments', price: 55, stock: 200, dosage: '15g', requiresPrescription: true },
        { name: 'Clotrimazole Ointment', category: 'Ointments', price: 85, stock: 180, dosage: '15g', requiresPrescription: false },
        { name: 'Nitrofurazone Cream', category: 'Ointments', price: 95, stock: 140, dosage: '20g', requiresPrescription: true },
        { name: 'Heparin Gel', category: 'Ointments', price: 320, stock: 60, dosage: '20g', requiresPrescription: true },
        { name: 'Capsaicin Heat Cream', category: 'Ointments', price: 150, stock: 110, dosage: '30g', requiresPrescription: false },

        // 13. Surgical Components (15)
        { name: 'Disposable Scalpel #11', category: 'Surgical', price: 180, stock: 400, dosage: 'Pack of 10', requiresPrescription: true },
        { name: 'Absorbable Sutures', category: 'Surgical', price: 850, stock: 50, dosage: '2-0 Ethicon', requiresPrescription: true },
        { name: 'Surgical Gloves (Sterile)', category: 'Surgical', price: 45, stock: 1000, dosage: 'Pair', requiresPrescription: false },
        { name: 'Artery Forceps', category: 'Surgical', price: 550, stock: 30, dosage: '6 inch', requiresPrescription: true },
        { name: 'N95 Respirator Node', category: 'Surgical', price: 95, stock: 500, dosage: 'Unit', requiresPrescription: false },
        { name: 'IV Cannula 20G', category: 'Surgical', price: 65, stock: 400, dosage: 'Unit', requiresPrescription: true },
        { name: 'Surgical Face Shield', category: 'Surgical', price: 120, stock: 200, dosage: 'Unit', requiresPrescription: false },
        { name: 'Gauze Swab (Sterile)', category: 'Surgical', price: 150, stock: 600, dosage: 'Pack of 100', requiresPrescription: false },
        { name: 'Disinfectant Spray Node', category: 'Surgical', price: 450, stock: 120, dosage: '500ml', requiresPrescription: false },
        { name: 'Blood Pressure Monitor', category: 'Surgical', price: 2200, stock: 40, dosage: 'Digital', requiresPrescription: false }
    ];

    const imageMap = {
        'Pain Relief': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1000&auto=format&fit=crop',
        'Antibiotic': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=1000&auto=format&fit=crop',
        'Allergy': 'https://images.unsplash.com/photo-1550572562-64d724ee9a3e?q=80&w=1000&auto=format&fit=crop',
        'Diabetes': 'https://images.unsplash.com/photo-1615461066834-f0b1c7e9bb6f?q=80&w=1000&auto=format&fit=crop',
        'Cardiac': 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?q=80&w=1000&auto=format&fit=crop',
        'Digestive': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop',
        'Mental Health': 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=1000&auto=format&fit=crop',
        'Dermatology': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop',
        'Supplements': 'https://images.unsplash.com/photo-1471133145326-039d7f95d883?q=80&w=1000&auto=format&fit=crop',
        'First Aid': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=1000&auto=format&fit=crop',
        'Personal Care': 'https://images.unsplash.com/photo-1626015519974-3fdec299fc88?q=80&w=1000&auto=format&fit=crop',
        'Ointments': 'https://images.unsplash.com/photo-1626885930974-4b69aa21bbf9?q=80&w=1000&auto=format&fit=crop',
        'Surgical': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1000&auto=format&fit=crop',
        'Eye/Ear': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=1000&auto=format&fit=crop'
    };

    // Advanced dynamic assignment for 185 distinct nodes
    const medicinesWithImages = medicines.map((m, index) => {
        let finalImage = '';

        // Strategy 1: Curated IDs for high-volume items
        if (m.name.includes('Inhaler')) finalImage = 'https://images.unsplash.com/photo-1558238647-7586071a93bd?q=80&w=1000&auto=format&fit=crop';
        else if (m.name.includes('Soap')) finalImage = 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1000&auto=format&fit=crop';
        else if (m.name.includes('Scalpel')) finalImage = 'https://images.unsplash.com/photo-1559757117-5941c90d64cc?q=80&w=1000&auto=format&fit=crop';
        else if (m.name.includes('Gloves')) finalImage = 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1000&auto=format&fit=crop';
        else if (m.name.includes('Spray')) finalImage = 'https://images.unsplash.com/photo-1550572562-64d724ee9a3e?q=80&w=1000&auto=format&fit=crop';

        // Strategy 2: Deterministic image fallback for uniqueness across nodes
        if (!finalImage) {
            const cleanName = encodeURIComponent(m.name.toLowerCase().replace(/\s+/g, '-'));
            finalImage = `https://picsum.photos/seed/medshop-${cleanName}-${index}/800/800`;
        }

        return { ...m, image: finalImage };
    });

    if (shouldResetOnSeed) {
        await Product.create(medicinesWithImages);
    } else {
        for (const medicine of medicinesWithImages) {
            await Product.updateOne(
                { name: medicine.name, dosage: medicine.dosage },
                { $set: medicine },
                { upsert: true }
            );
        }
    }

    console.log(`Database seeded with ${medicinesWithImages.length} Arctic visual nodes.`);
};

const startServer = async () => {
    try {
        await connectDatabase();

        if (shouldSeedOnStart) {
            await seedProducts();
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
