import Link from "next/link";

const SidebarItem = ({ name, route, isActive, icon: Icon }) => {
  const baseItemClasses =
    "flex items-center transition duration-200 ease-in-out rounded-lg py-3 px-4 my-1";

  const activeClasses = isActive
    ? `bg-[#50599C] text-white font-bold ${baseItemClasses}`
    : `text-gray-700 ${baseItemClasses} hover:bg-gray-100`;

  const itemClasses = `${baseItemClasses} ${activeClasses}`;

  return (
    <li className={itemClasses}>
      <Link href={route} className="flex items-center w-full h-full">
        {Icon && (
          <Icon
            className="flex-shrink-0"
            fill="currentColor"
            width={24}
            height={24}
          />
        )}
        {name && <span className="text-base font-sans ml-3">{name}</span>}
      </Link>
    </li>
  );
};

export default SidebarItem;
