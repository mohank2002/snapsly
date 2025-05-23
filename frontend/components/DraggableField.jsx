import { useDrag } from 'react-dnd';

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
      className="field-box"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        backgroundColor: '#fff',
      }}
    >
      {name}
    </div>
  );
};

export default DraggableField;
