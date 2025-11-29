import Link from "next/link";

const SidebarItem = ({ name, route, isActive, icon: Icon }) => {
  const baseItemClasses =
    "flex items-center transition duration-200 ease-in-out rounded-lg py-3 px-4 my-1 border-2";

  const activeClasses = isActive
    ? `bg-primary text-white font-bold border-primary shadow-md ${baseItemClasses}`
    : `text-gray-700 border-gray-200 hover:border-primary hover:bg-primary/5 ${baseItemClasses}`;

  const itemClasses = `${baseItemClasses} ${activeClasses}`;

  return (
    <li className={itemClasses}>
      <Link href={route} className="flex items-center w-full h-full">
        {Icon && (
          <Icon
            className="flex-shrink-0"
            sx={{ fontSize: 28 }}
          />
        )}
        {name && <span className="text-base font-sans ml-3">{name}</span>}
      </Link>
    </li>
  );
};

export default SidebarItem;
