import "./base.css";
import { person } from "./content";
import { mount } from "./stations/index";
import jagrit from "./stations/st/jagrit";
import chiki from "./stations/st/chiki";
import autterly from "./stations/st/autterly";
import studio from "./stations/st/studio";
import pixels from "./stations/st/pixels";
import opinions from "./stations/st/opinions";
import log from "./stations/st/log";
import mail from "./stations/st/mail";

// Demo: Jagrit's eight stations on the reusable dial.
mount(document.getElementById("app")!, {
  title: person.name,
  stations: [jagrit, chiki, autterly, studio, pixels, opinions, log, mail],
});
