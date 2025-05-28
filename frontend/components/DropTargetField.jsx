import { useDrop } from 'react-dnd';
import styles from '../styles/FieldBox.module.css';

const DropTargetField = ({ name, onDrop, isMapped }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'FIELD',
    drop: (item) => {
      if (item.type === 'source') {
        onDrop(item.name, name);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }));

  return (
    <div
      ref={drop}
      className={`field-box ${!isMapped ? 'unmatched' : ''}`}
      style={{
        backgroundColor: isOver && canDrop ? '#e0f2fe' : !isMapped ? '#fef2f2' : 'white',
        border: isOver && canDrop
          ? '2px dashed #3b82f6'
          : !isMapped
          ? '1px dashed #dc2626'
          : '1px solid #ccc'
      }}
    >
      {name}
    </div>
  );
};

export default DropTargetField;
