import './styles.css';
import router from './router';
import { createApp } from 'vue';
import { createPinia } from 'pinia'
import App from './app/App.vue';

const pinia = createPinia()

const app = createApp(App);

app.use(router);
app.use(pinia)

app.mount('#root');
