import('./server/lib/whatsapp.js')
    .then(() => console.log('Import successful'))
    .catch(e => {
        console.log('--- ERROR START ---');
        console.log(e);
        console.log('--- ERROR END ---');
        process.exit(1);
    });
