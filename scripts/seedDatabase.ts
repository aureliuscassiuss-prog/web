import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uninotes';

const sampleResources = [
    {
        title: 'Data Structures Complete Notes',
        course: 'B.Tech',
        branch: 'CSE',
        year: '2nd Year',
        subject: 'Data Structures',
        resourceType: 'notes',
        description: 'Comprehensive notes covering all topics including arrays, linked lists, trees, graphs, and algorithms.',
        downloads: 1234,
        rating: 4.8,
        uploader: 'Rahul Sharma',
        createdAt: new Date()
    },
    {
        title: 'DBMS Previous Year Questions 2023',
        course: 'B.Tech',
        branch: 'CSE',
        year: '3rd Year',
        subject: 'Database Management',
        resourceType: 'pyq',
        description: 'Complete collection of previous year questions with solutions for DBMS final exam.',
        downloads: 892,
        rating: 4.9,
        uploader: 'Priya Patel',
        createdAt: new Date()
    },
    {
        title: 'Operating Systems Formula Sheet',
        course: 'B.Tech',
        branch: 'CSE',
        year: '3rd Year',
        subject: 'Operating Systems',
        resourceType: 'formula-sheet',
        description: 'Quick reference formula sheet for OS concepts, scheduling algorithms, and memory management.',
        downloads: 567,
        rating: 4.7,
        uploader: 'Amit Kumar',
        createdAt: new Date()
    },
    {
        title: 'Machine Learning Algorithms Guide',
        course: 'B.Tech',
        branch: 'CSE',
        year: '4th Year',
        subject: 'Machine Learning',
        resourceType: 'notes',
        description: 'Complete guide to ML algorithms including supervised, unsupervised, and reinforcement learning.',
        downloads: 2100,
        rating: 4.9,
        uploader: 'Sneha Gupta',
        createdAt: new Date()
    },
    {
        title: 'Computer Networks Lab Manual',
        course: 'B.Tech',
        branch: 'CSE',
        year: '3rd Year',
        subject: 'Computer Networks',
        resourceType: 'notes',
        description: 'Complete lab manual with all experiments and their solutions for Computer Networks.',
        downloads: 845,
        rating: 4.6,
        uploader: 'Vikram Singh',
        createdAt: new Date()
    }
];

const samplePapers = [
    {
        title: 'Attention Is All You Need',
        authors: 'Vaswani et al.',
        year: '2017',
        summary: 'Introduced the Transformer architecture, revolutionizing natural language processing.',
        tags: ['NLP', 'Deep Learning', 'Transformers'],
        createdAt: new Date()
    },
    {
        title: 'BERT: Pre-training of Deep Bidirectional Transformers',
        authors: 'Devlin et al.',
        year: '2018',
        summary: 'Presented BERT, a method for pre-training language representations.',
        tags: ['NLP', 'BERT', 'Pre-training'],
        createdAt: new Date()
    },
    {
        title: 'Deep Residual Learning for Image Recognition',
        authors: 'He et al.',
        year: '2015',
        summary: 'Introduced ResNet, enabling training of very deep neural networks.',
        tags: ['Computer Vision', 'Deep Learning', 'ResNet'],
        createdAt: new Date()
    },
    {
        title: 'Generative Adversarial Networks',
        authors: 'Goodfellow et al.',
        year: '2014',
        summary: 'Introduced GANs, a framework for training generative models.',
        tags: ['Deep Learning', 'GANs', 'Generative Models'],
        createdAt: new Date()
    }
];

async function seedDatabase() {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB!');

        const db = client.db();

        // Clear existing data
        console.log('Clearing existing data...');
        await db.collection('resources').deleteMany({});
        await db.collection('papers').deleteMany({});

        // Insert sample resources
        console.log('Inserting sample resources...');
        const resourcesResult = await db.collection('resources').insertMany(sampleResources);
        console.log(`Inserted ${resourcesResult.insertedCount} resources`);

        // Insert sample papers
        console.log('Inserting sample papers...');
        const papersResult = await db.collection('papers').insertMany(samplePapers);
        console.log(`Inserted ${papersResult.insertedCount} papers`);

        console.log('\n✅ Database seeded successfully!');
        console.log(`\nResources: ${resourcesResult.insertedCount}`);
        console.log(`Papers: ${papersResult.insertedCount}`);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\nDatabase connection closed.');
    }
}

seedDatabase();
