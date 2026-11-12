import {defineConfig} from 'vite';
export default defineConfig({base:"./",server:{proxy:{'/api':{target:'http://127.0.0.1:8796',ws:true}}},build:{chunkSizeWarningLimit:650}});
