const mongoose = require('mongoose');
const fs = require('fs');

async function importData() {
    try {
        // MongoDB 연결
        await mongoose.connect('mongodb://localhost:27017/gsbot_db');
        console.log('Connected to gsbot_db');

        // JSON 파일 읽기
        const exportData = JSON.parse(fs.readFileSync('database_export.json', 'utf8'));
        
        for (let collectionName in exportData) {
            const documents = exportData[collectionName];
            if (documents.length > 0) {
                await mongoose.connection.db.collection(collectionName).insertMany(documents);
                console.log(`Imported ${documents.length} documents to ${collectionName}`);
            }
        }
        
        console.log('Import completed successfully');
        
    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

importData();
