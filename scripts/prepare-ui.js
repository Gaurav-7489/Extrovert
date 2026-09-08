/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const root = process.cwd();

function patch(relativePath, transform) {
  const filePath = path.join(root, relativePath);
  let source = fs.readFileSync(filePath, "utf8");
  const next = transform(source);
  if (next !== source) {
    fs.writeFileSync(filePath, next);
    console.log(`[prepare-ui] patched ${relativePath}`);
  }
}

// Keep only the small, idempotent interaction polish that belongs in the build.
// Identity/verification copy is source-controlled now and must never be rewritten here.
patch("src/app/(app)/app/social/explore-map.tsx", (source) => source
  .replace(
    /const anchors:Record<string,\{left:number;top:number\}>=\{[^;]+\};/,
    'const anchors:Record<string,{left:number;top:number}>={Waknaghat:{left:38.16,top:48.81},Solan:{left:46.68,top:79.19},Shimla:{left:77.36,top:14.58}};'
  )
  .replace(
    'className="absolute inset-0 h-full w-full border-0" loading="lazy"',
    'className="pointer-events-none absolute inset-0 h-full w-full border-0" loading="lazy"'
  )
);

patch("src/app/(app)/app/discover/discover-client.tsx", (source) => source
  .replace('useTransform(x,[-260,0,260],[-13,0,13])', 'useTransform(x,[-220,0,220],[-16,0,16])')
  .replace('useTransform(x,[30,120], [0,1])', 'useTransform(x,[12,55], [0,1])')
  .replace('useTransform(x,[-120,-30],[1,0])', 'useTransform(x,[-55,-12],[1,0])')
  .replace('dragElastic={.18}', 'dragElastic={.32}')
  .replace('Math.abs(i.offset.x)>120', 'Math.abs(i.offset.x)>55')
  .replace(
    '{area&&<span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2.5 py-1.5 text-[9px] font-black backdrop-blur"><MapPin className="h-3 w-3"/>{profile.area_name||"Area verified"}</span>}',
    '{area&&<span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-500/85 px-2.5 py-1.5 text-[9px] font-black text-white shadow-lg backdrop-blur"><MapPin className="h-3 w-3"/>Area verified{profile.area_name?` · ${profile.area_name}`:""}</span>}'
  )
);
