import { useDrag } from 'react-dnd';
import styles from '../styles/FieldBox.module.css';

const DraggableField = ({ name }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FIELD',
    item: { name, type: 'source' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className={styles.fieldBox}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {name}
    </div>
  );
};

export default DraggableField;
