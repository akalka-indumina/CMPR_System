import React from 'react';
import htm from 'htm';

// Tagged-template helper used by the components: h`<div class=${...}></div>`
export const h = htm.bind(React.createElement);
