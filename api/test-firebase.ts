keyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
    appName
        };

return res.status(200).json({ status: 'Firebase Admin OK', config: configCheck });
    } catch (error: any) {
    return res.status(500).json({ status: 'Error', error: error.message, stack: error.stack });
}
}
