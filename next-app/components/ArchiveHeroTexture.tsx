/** Original drafting marks and stage-light shapes; decoration never intercepts a link. */
export function ArchiveHeroTexture() {
  return <div className="archive-hero__texture" aria-hidden="true">
    <svg className="archive-hero__drawing archive-hero__drawing--mobile" viewBox="0 0 400 470" preserveAspectRatio="none" fill="none" focusable="false">
      <defs>
        <pattern id="archive-grid-mobile" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" stroke="#131720" strokeOpacity=".09" strokeWidth=".6"/></pattern>
        <pattern id="archive-dots-mobile" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#131720"/></pattern>
        <linearGradient id="archive-blue-mobile" x1="400" y1="100" x2="280" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="#315cff" stopOpacity=".34"/><stop offset="1" stopColor="#315cff" stopOpacity="0"/></linearGradient>
        <linearGradient id="archive-lime-mobile" x1="255" y1="0" x2="365" y2="300" gradientUnits="userSpaceOnUse"><stop stopColor="#e0f16a" stopOpacity=".55"/><stop offset="1" stopColor="#e0f16a" stopOpacity="0"/></linearGradient>
      </defs>
      <path d="M246 0h31l123 223-50 92Z" fill="url(#archive-lime-mobile)"/>
      <path d="m400 85-121 192 121 131Z" fill="url(#archive-blue-mobile)"/>
      <path d="M170 35h126v146H170z" fill="url(#archive-grid-mobile)"/>
      <path d="M18 14h48v26H18z" fill="url(#archive-dots-mobile)"/>
      <path d="M0 119h20v56H0zM238 222h78v36h-78zM0 379h48v33H0z" fill="url(#archive-dots-mobile)" opacity=".12"/>
      <g stroke="#131720" strokeWidth=".55" opacity=".65"><path d="M277 60a68 68 0 1 1-6 136m54-144v145m-10-72h77M0 25l244 235M0 413l47 57m333-285v52"/></g>
      <g fill="#131720" opacity=".065"><path d="M329 421h50v8h-50zM314 434h50v8h-50zM299 447h50v8h-50zM284 460h50v8h-50zM344 408h50v8h-50zM359 395h41v8h-41zM374 382h26v8h-26z"/></g>
      <text x="351" y="61" fill="#444e58" fontFamily="Arial, sans-serif" fontSize="5.2" letterSpacing=".9"><tspan x="351">STAGE</tspan><tspan x="351" dy="8.5">DRAMA</tspan><tspan x="351" dy="8.5">MUSICAL</tspan><tspan x="351" dy="8.5">2.5D</tspan><tspan x="351" dy="8.5">AND MORE</tspan></text>
    </svg>
    <svg className="archive-hero__drawing archive-hero__drawing--desktop" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" fill="none" focusable="false">
      <defs>
        <pattern id="archive-grid-desktop" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0H0V38" stroke="#131720" strokeOpacity=".08"/></pattern>
        <pattern id="archive-dots-desktop" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="#131720"/></pattern>
        <linearGradient id="archive-lime-desktop" x1="970" y1="0" x2="1240" y2="590" gradientUnits="userSpaceOnUse"><stop stopColor="#e0f16a" stopOpacity=".6"/><stop offset="1" stopColor="#e0f16a" stopOpacity="0"/></linearGradient>
        <linearGradient id="archive-blue-desktop" x1="1440" y1="100" x2="1040" y2="670" gradientUnits="userSpaceOnUse"><stop stopColor="#315cff" stopOpacity=".32"/><stop offset="1" stopColor="#315cff" stopOpacity="0"/></linearGradient>
      </defs>
      <path d="M930 0h96l327 585-133 135Z" fill="url(#archive-lime-desktop)"/>
      <path d="m1440 84-394 577 394 59Z" fill="url(#archive-blue-desktop)"/>
      <path d="M635 65h455v380H635z" fill="url(#archive-grid-desktop)"/>
      <path d="M42 25h90v45H42z" fill="url(#archive-dots-desktop)"/>
      <path d="M775 463h160v80H775zM0 530h84v90H0z" fill="url(#archive-dots-desktop)" opacity=".12"/>
      <g stroke="#131720" opacity=".5"><path d="M1030 136a146 146 0 1 1-15 291m117-309v314m-51-155h285M0 58l433 423M0 620l110 100m1257-249v101"/></g>
      <g fill="#131720" opacity=".065"><path d="M1150 666h135v13h-135zM1121 690h135v13h-135zM1179 642h135v13h-135zM1208 618h135v13h-135zM1237 594h135v13h-135zM1266 570h135v13h-135zM1295 546h135v13h-135zM1324 522h116v13h-116z"/></g>
      <text x="1265" y="133" fill="#444e58" fontFamily="Arial, sans-serif" fontSize="11" letterSpacing="2"><tspan x="1265">STAGE</tspan><tspan x="1265" dy="19">DRAMA</tspan><tspan x="1265" dy="19">MUSICAL</tspan><tspan x="1265" dy="19">2.5D</tspan><tspan x="1265" dy="19">AND MORE</tspan></text>
    </svg>
  </div>;
}
