try {
    const whatsapp = await import('./server/lib/whatsapp.js');
    console.log('Import successful!');
} catch (err) {
    console.error('IMPORT FAILED:');
    console.error(err);
}
