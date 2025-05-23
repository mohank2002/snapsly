import { useDrop } from 'react-dnd';

const DropTargetField = ({ name, onDrop, isMapped }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FIELD',
    drop: (item) => {
      if (item.type === 'source') {
        onDrop(item.name, name);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      className={`field-box ${isOver ? 'bg-green-100' : ''} ${isMapped ? 'opacity-60' : ''}`}
      style={{
        backgroundColor: isOver ? '#d1fae5' : '#f9fafb',
        opacity: isMapped ? 0.6 : 1,
        cursor: 'pointer',
      }}
    >
      {name}
    </div>
  );
};

export default DropTargetField;
