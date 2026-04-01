import { Link } from "@tanstack/react-router";
import { PowerButton } from "./PowerButton";

export const Navbar = () => {
  return (
    <div className="w-full flex items-center justify-end border-b-3 border-border">
      <ul className="flex h-full items-center">
        <li className="px-4 min-w-24 h-full flex items-center justify-center border-l-3 border-border">
          <Link to="/">Work</Link>
        </li>
        <li className="px-4 min-w-24 h-full flex items-center justify-center border-l-3 border-border">
          <Link to="/blog">Blogs</Link>
        </li>
        <li className="px-4 min-w-24 h-full flex items-center justify-center border-l-3 border-border">
          <Link to="/about">Projects</Link>
        </li>
      </ul>
      <div>
        <PowerButton />
      </div>
    </div>
  );
};
