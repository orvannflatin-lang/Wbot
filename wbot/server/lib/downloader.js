import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * WBOT Media Downloader Utility
 * Inspired by OVL logic for multi-platform support
 */

export const facebookDl = async (url) => {
    try {
        const { data } = await axios.post('https://getmyfb.com/process', new URLSearchParams({
            id: url,
            locale: 'en'
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const videoUrl = $('.results-list-item-config a').first().attr('href');
        return videoUrl || null;
    } catch (e) {
        return null;
    }
};

export const tiktokDl = async (url) => {
    try {
        const { data } = await axios.post('https://ssstik.io/abc?url=dl', new URLSearchParams({
            id: url,
            locale: 'fr',
            tt: '0'
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const videoUrl = $('.download_link').first().attr('href');
        return videoUrl || null;
    } catch (e) {
        return null;
    }
};

export const instagramDl = async (url) => {
    try {
        // Simple scraper for IG (often breaks, but basic attempt)
        const { data } = await axios.post('https://v3.saveig.app/api/ajaxSearch', new URLSearchParams({
            q: url,
            t: 'media',
            lang: 'en'
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }
        });
        if (data.status === 'ok') {
            const $ = cheerio.load(data.data);
            const videoUrl = $('.download-items__btn a').first().attr('href');
            return videoUrl || null;
        }
        return null;
    } catch (e) {
        return null;
    }
};

// Simplified YouTube search and info fetching
export const youtubeInfo = async (url) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const title = $('meta[name="title"]').attr('content') || 'YouTube Video';
        return { title };
    } catch (e) {
        return { title: 'Video' };
    }
};

import yts from 'yt-search';
export const playYoutube = async (query) => {
    try {
        const search = await yts(query);
        const video = search.videos[0];
        if (!video) return null;
        return {
            title: video.title,
            thumbnail: video.thumbnail,
            url: video.url,
            duration: video.timestamp,
            author: video.author.name
        };
    } catch (e) {
        return null;
    }
};
