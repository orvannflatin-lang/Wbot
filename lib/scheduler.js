import cron from 'node-cron';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import { getSession } from './whatsapp.js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

export const initScheduler = () => {
    // 1. Cleanup Cloudinary (Every day at midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Cloudinary Cleanup...');
        // Example: Delete resources older than 4 days
        // Note: Requires Admin API enabled.
        // Or simpler: We can use Cloudinary "Temp" tags or search API if plan allows.
        // Here we assume we tracked them or just use a basic specialized deletion logic if possible.
        // For now, logging as a reminder/placeholder for the specific tracked deletion strategy.
        try {
            // const date = new Date();
            // date.setDate(date.getDate() - 4);
            // await cloudinary.api.delete_resources_by_tag('wbot_temp'); // If we tagged them
            console.log('Cloudinary cleanup job triggered.');
        } catch (err) {
            console.error('Cleanup failed:', err);
        }
    });

    // 2. Scheduled Messages/Status (Every minute)
    cron.schedule('* * * * *', async () => {
        // Fetch pending tasks from DB
        const { data: tasks, error } = await supabase
            .from('scheduled_tasks')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString());

        if (error || !tasks) return;

        for (const task of tasks) {
            const session = getSession(task.session_id);
            if (session) {
                try {
                    if (task.type === 'message') {
                        await session.sendMessage(task.recipient, { text: task.content });
                    } else if (task.type === 'status') {
                        await session.sendMessage('status@broadcast', { text: task.content, backgroundColor: '#000000' });
                    }

                    // Update status to sent
                    await supabase.from('scheduled_tasks').update({ status: 'sent' }).eq('id', task.id);
                } catch (err) {
                    console.error('Task failed:', err);
                    await supabase.from('scheduled_tasks').update({ status: 'failed', error: err.message }).eq('id', task.id);
                }
            } else {
                console.log(`Session ${task.session_id} not active for task ${task.id}`);
            }
        }
    });
};
