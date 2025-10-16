export default function PropertyDetail({ params }) {
  const { id } = params;
  
  // Fetch or filter your property data by id
  const property = properties.find(p => p.id === id);
  
  return (
    <div>
      <h1>{property.title}</h1>
      <p>Property ID: {id}</p>
      {/* rest of your property details */}
    </div>
  );
}