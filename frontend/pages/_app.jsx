import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'react-hot-toast';
import '../styles/global.css'; // if you have global styles

export default function MyApp({ Component, pageProps }) {
  return (
    <DndProvider backend={HTML5Backend}>
      
        <Toaster position="top-right" />
        <Component {...pageProps} />
      
    </DndProvider>
  );
}
