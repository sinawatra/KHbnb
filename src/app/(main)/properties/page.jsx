import Link from "next/link";

export default function Properties() {
  return (
    <div>
      {/* {properties.map(property => (
        <Link href={`/properties/${property.id}`} key={property.id}>
          <PropertyCard property={property} />
        </Link>
      ))} */}
      <section>
        <h1>View All Properties</h1>
      </section>
    </div>
  );
}
