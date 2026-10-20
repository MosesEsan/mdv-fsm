// Composition root for modules. Import once at app start (e.g. app/_layout.tsx), before
// any settings hook runs. Core never imports module code; this file does.
import './timesheets/register';
import './flooring/register';
import './extraWork/register';
