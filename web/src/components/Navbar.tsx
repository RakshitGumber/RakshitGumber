import { Link } from "@tanstack/react-router";
import { PowerButton } from "./PowerButton";

export const Navbar = () => {
  return (
    <div className="w-full flex items-center justify-end border-b-2 border-border fixed h-14">
      <ul className="flex h-full items-center">
        <li className="px-4 min-w-24 h-full flex items-center justify-center border-l-2 border-border">
          <Link to="/">Work</Link>
        </li>
        <li className="px-4 min-w-24 h-full flex items-center justify-center border-l-2 border-border">
          <Link to="/blog">Blogs</Link>
        </li>
        <li className="px-4 min-w-24 h-full flex items-center justify-center border-l-2 border-border">
          <Link to="/projects">Projects</Link>
        </li>
      </ul>
      <div className="flex h-full items-center">
        <PowerButton />
      </div>
    </div>
  );
};
