/* builder.js: Custom Dream House 3D Builder & PDF Print Studio.
 * Pure canvas isometric renderer (no libraries). Part 1: data + drawing. Part 2 (below): UI, interaction, export, check-in. */
(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };
    var cv = $('bdCanvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');

    /* ------------------------------------------------------------------ constants */
    var A = 28, B = 14, C = 24;          // isometric projection (2:1)
    var WH = 3.2;                        // wall height in height units (1 unit = 0.75 m)
    var T = 0.75;                        // metres per tile
    var M = 2;                           // plot margin around the house, in tiles
    var RH = 1.7;                        // roof rise
    var V = { ox: 0, oy: 0, k: 1 };      // current view (offset + scale)

    /* ------------------------------------------------------------------ data */
    var LAYOUTS = [
        {
            id: 'studio', n: 'Studio', cols: 6, rows: 5, seg: [[4, 0, 4, 2], [4, 2, 5, 2]],
            rooms: [[0, 0, 4, 5, '#cfe3f5'], [4, 0, 2, 2, '#f3e0c4'], [4, 2, 2, 3, '#d9ecd2']]
        },
        {
            id: '1bhk', n: '1 BHK', cols: 8, rows: 6, seg: [[4, 0, 4, 2], [4, 3, 4, 6], [6, 0, 6, 2]],
            rooms: [[0, 0, 4, 6, '#f3d9d5'], [4, 0, 2, 2, '#f3e0c4'], [6, 0, 2, 2, '#d9ecd2'], [4, 2, 4, 4, '#cfe3f5']]
        },
        {
            id: '2bhk', n: '2 BHK', cols: 10, rows: 7, seg: [[5, 0, 5, 3], [5, 4, 5, 7], [0, 3, 3, 3], [4, 3, 5, 3]],
            rooms: [[0, 0, 5, 3, '#f3d9d5'], [0, 3, 5, 4, '#e3d9f3'], [5, 0, 5, 7, '#cfe3f5']]
        },
        {
            id: '3bhk', n: '3 BHK', cols: 12, rows: 8, seg: [[4, 0, 4, 3], [4, 4, 4, 8], [0, 3, 2, 3], [3, 3, 4, 3], [8, 0, 8, 3], [8, 4, 8, 8], [8, 4, 10, 4], [11, 4, 12, 4]],
            rooms: [[0, 0, 4, 3, '#f3d9d5'], [0, 3, 4, 5, '#e3d9f3'], [4, 0, 4, 8, '#cfe3f5'], [8, 0, 4, 4, '#d9ecd2'], [8, 4, 4, 4, '#f3e0c4']]
        },
        {
            id: 'lshape', n: 'L-Shape', cols: 10, rows: 9, cut: [6, 5, 4, 4], seg: [[6, 0, 6, 2], [6, 3, 6, 5]],
            rooms: [[0, 0, 6, 9, '#cfe3f5'], [6, 0, 4, 5, '#f3d9d5']]
        },
        {
            id: 'court', n: 'Courtyard', cols: 12, rows: 10, cut: [4, 3, 4, 4], seg: [[4, 0, 4, 3], [8, 0, 8, 3], [0, 3, 0, 3]],
            rooms: [[0, 0, 4, 10, '#f3d9d5'], [8, 0, 4, 10, '#d9ecd2'], [4, 0, 4, 3, '#cfe3f5'], [4, 7, 4, 3, '#f3e0c4']]
        },
        {
            id: 'villa', n: 'Villa', cols: 14, rows: 10, seg: [[5, 0, 5, 4], [5, 5, 5, 10], [9, 0, 9, 3], [9, 4, 9, 10], [0, 4, 4, 4], [10, 5, 14, 5]],
            rooms: [[0, 0, 5, 4, '#f3d9d5'], [0, 4, 5, 6, '#e3d9f3'], [5, 0, 4, 10, '#cfe3f5'], [9, 0, 5, 5, '#d9ecd2'], [9, 5, 5, 5, '#f3e0c4']]
        }
    ];
    var BOUNDS = [
        { n: 'Low brick wall', h: 0.8, pat: 'brick', c1: '#b5523b', c2: '#d9917c', cap: '#8f3f2d', p: 70 },
        { n: 'High brick wall', h: 1.9, pat: 'brick', c1: '#a8493a', c2: '#d38b78', cap: '#7f372b', p: 120 },
        { n: 'Natural stone wall', h: 1.2, pat: 'stone', c1: '#8d8f93', c2: '#c4c6ca', cap: '#6f7276', p: 140 },
        { n: 'White plastered wall', h: 1.6, pat: 'plain', c1: '#f1f0ec', c2: '#d5d3cc', cap: '#c9c6bd', p: 85 },
        { n: 'Concrete block wall', h: 1.4, pat: 'block', c1: '#a9adb2', c2: '#7f848a', cap: '#8a8f95', p: 75 },
        { n: 'Wooden picket fence', h: 1.1, pat: 'picket', c1: '#d8b27a', c2: '#a98350', cap: '#a98350', p: 55 },
        { n: 'Bamboo fence', h: 1.5, pat: 'bamboo', c1: '#c9b46a', c2: '#7d8a3c', cap: '#6b7a30', p: 48 },
        { n: 'Iron grill fence', h: 1.4, pat: 'bars', c1: '#22262b', c2: '#22262b', cap: '#22262b', p: 95 },
        { n: 'Wrought iron spears', h: 1.6, pat: 'spears', c1: '#1c2025', c2: '#1c2025', cap: '#1c2025', p: 130 },
        { n: 'Glass panel fence', h: 1.3, pat: 'glass', c1: '#9fd0e6', c2: '#e8f6fc', cap: '#6f8fa0', p: 190 },
        { n: 'Green hedge', h: 1.3, pat: 'hedge', c1: '#2f6b3a', c2: '#4f9a52', cap: '#2f6b3a', p: 45 },
        { n: 'Chain-link fence', h: 1.3, pat: 'mesh', c1: '#9aa3ab', c2: '#6c747b', cap: '#6c747b', p: 30 },
        { n: 'Composite slat fence', h: 1.5, pat: 'slats', c1: '#6a4a35', c2: '#4a3223', cap: '#3d291c', p: 110 },
        { n: 'Cobblestone low wall', h: 0.7, pat: 'cobble', c1: '#9a948a', c2: '#c6c0b5', cap: '#7a756c', p: 100 },
        { n: 'Pillars with grill', h: 1.6, pat: 'pillars', c1: '#22262b', c2: '#b5523b', cap: '#8f3f2d', p: 160 },
        { n: 'Lattice trellis', h: 1.5, pat: 'trellis', c1: '#d8c9a5', c2: '#4f9a52', cap: '#a8997a', p: 65 }
    ];
    var WALLS = [['Warm White', '#f4efe6'], ['Soft Grey', '#cfd4d9'], ['Sage', '#b7c9b0'], ['Sky Blue', '#bcd7ea'], ['Blush', '#e8c9c4'], ['Sand', '#e6d3a3'], ['Terracotta', '#c9795b'], ['Navy', '#2b3a55'],
    ['Forest', '#2f5d4a'], ['Mustard', '#d9a93a'], ['Lavender', '#cdbfe3'], ['Charcoal', '#3a3d42'], ['Mint', '#c6e8d8'], ['Peach', '#f2c6a0'], ['Teal', '#2c7a7b'], ['Cocoa', '#7a5a46']];
    var MARBLE = [{ n: 'Carrara White', c: '#eceff1', v: '#8f99a3', p: 95 }, { n: 'Nero Marquina', c: '#1d1d20', v: '#e9e9e9', p: 130 }, { n: 'Emperador Brown', c: '#7a5a45', v: '#d9c3a5', p: 120 },
    { n: 'Verde Alpi Green', c: '#2e5a47', v: '#cfe3d6', p: 125 }, { n: 'Calacatta Gold', c: '#f2ebdf', v: '#c8a24a', p: 150 }, { n: 'Rosa Aurora Pink', c: '#d9a79f', v: '#fff1ee', p: 115 }];
    var WOOD = [{ n: 'Natural Oak', c: '#c69c6d', p: 68 }, { n: 'Dark Walnut', c: '#6b4a32', p: 92 }, { n: 'Golden Teak', c: '#a8743a', p: 110 },
    { n: 'Pale Ash', c: '#d9c7a3', p: 62 }, { n: 'Black Ebony', c: '#2d2420', p: 120 }, { n: 'Bamboo', c: '#d4b86a', p: 55 }];
    var ROOFS = [{ id: 'flat', n: 'Flat slab', r: 55 }, { id: 'gable', n: 'Gable', r: 72 }, { id: 'hip', n: 'Hip', r: 88 }, { id: 'shed', n: 'Shed (mono-pitch)', r: 62 }, { id: 'butterfly', n: 'Butterfly', r: 78 }];
    var ROOFCOLS = [['Terracotta', '#b5523b'], ['Slate Grey', '#5f6b78'], ['Charcoal', '#33373d'], ['Forest Green', '#3f6b4f'], ['Chocolate', '#6a4a35'], ['White', '#f2f2f2']];
    var FACADES = [['Cream', '#efe7d6'], ['White', '#fafafa'], ['Stone', '#bdb6a8'], ['Brick Red', '#a8523a'], ['Slate', '#5d6b7a'], ['Olive', '#7d8a5c'], ['Charcoal', '#343a40'], ['Sunset Orange', '#d98b5f']];

    function b(lx, ly, lz, w, d, h, c) { return ['b', lx, ly, lz, w, d, h, c]; }
    function ln(x1, y1, z1, x2, y2, z2, c, lw) { return ['l', x1, y1, z1, x2, y2, z2, c, lw || 1.2]; }
    function dot(lx, ly, lz, r, c) { return ['o', lx, ly, lz, r, c]; }
    function legs(x, y, w, d, h, c, t) { t = t || .1; return [b(x, y, 0, t, t, h, c), b(x + w - t, y, 0, t, t, h, c), b(x, y + d - t, 0, t, t, h, c), b(x + w - t, y + d - t, 0, t, t, h, c)]; }
    function cat(a) { return [].concat.apply([], a); }
    function doors(w, h, n, z0, c) { var o = []; for (var i = 1; i < n; i++) o.push(ln(w * i / n, 1, z0, w * i / n, 1, h, c || '#00000040', 1)); return o; }
    function stairs() { var o = []; for (var i = 7; i >= 0; i--) o.push(b(0, 3.5 - i * .5, 0, 2, .5, (i + 1) * .32, i % 2 ? '#c9b18f' : '#d6c3a3')); return o; }
    function sofa(w, c, c2) { var o = [b(0, .12, 0, w, .88, .45, c), b(0, 0, 0, w, .26, 1.0, c2), b(0, .1, 0, .3, .9, .78, c2), b(w - .3, .1, 0, .3, .9, .78, c2)]; var n = Math.max(1, Math.round((w - .6) / .85)), cw = (w - .6) / n; for (var i = 0; i < n; i++) o.push(b(.3 + i * cw + .03, .28, .45, cw - .06, .68, .16, '#9db1c9')); return o; }
    var F = [
        { id: 'sofa3', n: '3-Seat Sofa', cat: 'Living', w: 3, d: 1, p: 900, parts: sofa(3, '#6b7f9a', '#5c6f8a') },
        { id: 'sofaL', n: 'L-Shaped Sofa', cat: 'Living', w: 3, d: 2, p: 1400, parts: cat([sofa(3, '#8a6f5a', '#7a5f4b'), [b(0, 1, 0, 1, 1, .45, '#8a6f5a'), b(.04, 1.05, .45, .92, .9, .16, '#b49a82')]]) },
        { id: 'arm', n: 'Armchair', cat: 'Living', w: 1, d: 1, p: 350, parts: [b(0, .1, 0, 1, .9, .45, '#b0783f'), b(0, 0, 0, 1, .25, .95, '#9a6830'), b(0, .1, 0, .2, .9, .7, '#9a6830'), b(.8, .1, 0, .2, .9, .7, '#9a6830')] },
        { id: 'coffee', n: 'Coffee Table', cat: 'Living', w: 1, d: 1, p: 180, parts: cat([legs(.1, .1, .8, .8, .4, '#6b4a30', .08), [b(.05, .05, .4, .9, .9, .08, '#8a6a4a')]]) },
        { id: 'tvunit', n: 'TV Unit with TV', cat: 'Living', w: 3, d: 1, p: 420, parts: [b(0, 0, 0, 3, .8, .55, '#5a4636'), b(.5, .32, .55, 2, .08, 1.15, '#111418'), ln(.6, .4, 1.55, 2.4, .4, .75, '#4a6a8a55', 2)] },
        { id: 'shelf', n: 'Bookshelf', cat: 'Living', w: 2, d: 1, p: 320, parts: [b(0, 0, 0, 2, .6, 2.4, '#7a5a3a'), ln(.05, .6, .6, 1.95, .6, .6, '#00000055'), ln(.05, .6, 1.2, 1.95, .6, 1.2, '#00000055'), ln(.05, .6, 1.8, 1.95, .6, 1.8, '#00000055'), b(.2, .15, 1.2, .12, .4, .5, '#c0504d'), b(.36, .15, 1.2, .1, .4, .55, '#4a7ab0'), b(1.2, .15, 1.8, .14, .4, .45, '#e0b040')] },
        { id: 'rug', n: 'Area Rug', cat: 'Living', w: 3, d: 2, p: 220, flat: true, parts: [b(0, 0, 0, 3, 2, .04, '#b86b5a'), b(.2, .2, .04, 2.6, 1.6, .01, '#e0a898')] },
        { id: 'sidet', n: 'Side Table + Lamp', cat: 'Living', w: 1, d: 1, p: 90, parts: [b(.2, .2, 0, .6, .6, .7, '#8a6a4a'), ln(.5, .5, .7, .5, .5, 1.2, '#555', 2), dot(.5, .5, 1.3, .24, '#f2d98a')] },
        { id: 'fridge', n: 'Refrigerator', cat: 'Kitchen', w: 1, d: 1, p: 1100, parts: [b(0, 0, 0, 1, 1, 2.5, '#cfd5da'), ln(.04, 1, 1.5, .96, 1, 1.5, '#8b949c', 1.6), ln(.82, 1, 1.65, .82, 1, 2.2, '#6b737a', 2.4), ln(.82, 1, .5, .82, 1, 1.3, '#6b737a', 2.4)] },
        { id: 'counter', n: 'Kitchen Counter', cat: 'Kitchen', w: 3, d: 1, p: 750, parts: cat([[b(0, 0, 0, 3, 1, 1.15, '#e9e4da'), b(0, 0, 1.15, 3, 1, .1, '#4b4f56')], doors(3, 1.05, 3, .1)]) },
        { id: 'range', n: 'Cooking Range', cat: 'Kitchen', w: 1, d: 1, p: 650, parts: [b(0, 0, 0, 1, 1, 1.15, '#3d4046'), b(0, 0, 1.15, 1, 1, .06, '#16181b'), dot(.3, .3, 1.24, .11, '#555'), dot(.7, .3, 1.24, .11, '#555'), dot(.3, .7, 1.24, .11, '#555'), dot(.7, .7, 1.24, .11, '#555'), b(.12, .98, .3, .76, .03, .55, '#222a30')] },
        { id: 'island', n: 'Kitchen Island', cat: 'Kitchen', w: 2, d: 1, p: 900, parts: cat([[b(0, 0, 0, 2, 1, 1.15, '#d8cdb8'), b(0, 0, 1.15, 2, 1, .12, '#43464d')], doors(2, 1.05, 2, .1)]) },
        { id: 'sink', n: 'Sink Unit', cat: 'Kitchen', w: 2, d: 1, p: 520, parts: cat([[b(0, 0, 0, 2, 1, 1.15, '#e9e4da'), b(0, 0, 1.15, 2, 1, .08, '#4b4f56'), b(.4, .2, 1.2, 1.2, .6, .02, '#9aa3ab'), ln(1, .12, 1.25, 1, .12, 1.65, '#8b949c', 2.4)], doors(2, 1.05, 2, .1)]) },
        { id: 'dish', n: 'Dishwasher', cat: 'Kitchen', w: 1, d: 1, p: 600, parts: [b(0, 0, 0, 1, 1, 1.15, '#b9bec4'), b(0, 0, 1.15, 1, 1, .06, '#4b4f56'), ln(.1, 1, .85, .9, 1, .85, '#6b737a', 2.2), ln(.1, 1, .6, .9, 1, .6, '#00000040')] },
        { id: 'tallcab', n: 'Tall Cabinet', cat: 'Kitchen', w: 2, d: 1, p: 380, parts: cat([[b(0, 0, 0, 2, 1, 2.7, '#c9b18f')], doors(2, 2.6, 2, .1), [ln(.9, 1, 1.2, .9, 1, 1.6, '#6b4a30', 2.2), ln(1.1, 1, 1.2, 1.1, 1, 1.6, '#6b4a30', 2.2)]]) },
        { id: 'dine4', n: '4-Seat Dining Set', cat: 'Dining', w: 2, d: 2, p: 650, parts: cat([legs(.3, .3, 1.4, 1.4, .75, '#6b4a30', .1), [b(.25, .25, .75, 1.5, 1.5, .08, '#8a6a4a'), b(.7, 0, 0, .6, .22, .55, '#7a5a3a'), b(.7, 1.78, 0, .6, .22, .55, '#7a5a3a'), b(0, .7, 0, .22, .6, .55, '#7a5a3a'), b(1.78, .7, 0, .22, .6, .55, '#7a5a3a')]]) },
        { id: 'dine6', n: '6-Seat Dining Set', cat: 'Dining', w: 3, d: 2, p: 950, parts: cat([legs(.3, .3, 2.4, 1.4, .75, '#5a3d2b', .1), [b(.25, .25, .75, 2.5, 1.5, .08, '#7a5436'), b(.4, 0, 0, .6, .22, .55, '#6a4a30'), b(1.2, 0, 0, .6, .22, .55, '#6a4a30'), b(2, 0, 0, .6, .22, .55, '#6a4a30'), b(.4, 1.78, 0, .6, .22, .55, '#6a4a30'), b(1.2, 1.78, 0, .6, .22, .55, '#6a4a30'), b(2, 1.78, 0, .6, .22, .55, '#6a4a30')]]) },
        { id: 'side', n: 'Sideboard Cabinet', cat: 'Dining', w: 2, d: 1, p: 480, parts: cat([[b(0, 0, 0, 2, .7, .95, '#7b5d44'), b(0, 0, .95, 2, .7, .06, '#5a4332')], [ln(1, .7, .1, 1, .7, .9, '#00000050', 1)]]) },
        { id: 'kbed', n: 'Master Bed (King)', cat: 'Bedroom', w: 3, d: 3, p: 1300, parts: [b(0, 0, 0, 3, 3, .4, '#6b4a35'), b(0, 0, 0, 3, .22, 1.3, '#5a3d2b'), b(.1, .22, .4, 2.8, 2.7, .34, '#f1ede4'), b(.1, 1.2, .74, 2.8, 1.72, .08, '#6c8fa8'), b(.3, .34, .74, 1.1, .5, .18, '#ffffff'), b(1.6, .34, .74, 1.1, .5, .18, '#ffffff')] },
        { id: 'sbed', n: 'Single Bed', cat: 'Bedroom', w: 2, d: 3, p: 480, parts: [b(0, 0, 0, 2, 3, .38, '#8a6a4a'), b(0, 0, 0, 2, .2, 1.0, '#6b4a30'), b(.08, .2, .38, 1.84, 2.72, .3, '#f1ede4'), b(.08, 1.1, .68, 1.84, 1.82, .07, '#b07a8a'), b(.3, .32, .68, 1.4, .5, .16, '#ffffff')] },
        { id: 'ward', n: 'Wardrobe', cat: 'Bedroom', w: 3, d: 1, p: 780, parts: cat([[b(0, 0, 0, 3, 1, 2.7, '#cdb89a')], doors(3, 2.6, 3, .1), [ln(.9, 1, 1.1, .9, 1, 1.6, '#6b4a30', 2.2), ln(2.1, 1, 1.1, 2.1, 1, 1.6, '#6b4a30', 2.2)]]) },
        { id: 'nstand', n: 'Nightstand', cat: 'Bedroom', w: 1, d: 1, p: 140, parts: [b(.15, .15, 0, .7, .7, .62, '#8a6a4a'), ln(.2, .85, .38, .8, .85, .38, '#00000055', 1.2)] },
        { id: 'dresser', n: 'Dresser', cat: 'Bedroom', w: 2, d: 1, p: 420, parts: [b(0, 0, 0, 2, .8, 1.0, '#a98a68'), ln(.05, .8, .33, 1.95, .8, .33, '#00000050'), ln(.05, .8, .66, 1.95, .8, .66, '#00000050')] },
        { id: 'desk', n: 'Study Desk + Chair', cat: 'Bedroom', w: 2, d: 1, p: 360, parts: cat([legs(0, 0, 2, .6, .75, '#6b4a30', .08), [b(0, 0, .75, 2, .6, .08, '#8a6a4a'), b(.7, .1, .83, .6, .05, .42, '#111418'), b(.7, .68, 0, .5, .3, .5, '#3a3f46')]]) },
        { id: 'tub', n: 'Bathtub', cat: 'Bath', w: 2, d: 1, p: 900, parts: [b(0, 0, 0, 2, 1, .6, '#f4f6f8'), b(.12, .12, .55, 1.76, .76, .06, '#a9d3ea'), ln(1, .06, .6, 1, .06, 1, '#8b949c', 2.4)] },
        { id: 'wc', n: 'Toilet', cat: 'Bath', w: 1, d: 1, p: 280, parts: [b(.2, 0, 0, .6, .32, .95, '#f6f7f8'), b(.25, .3, 0, .5, .62, .45, '#f6f7f8'), b(.22, .32, .45, .56, .58, .05, '#e6e9ec')] },
        { id: 'vanity', n: 'Vanity + Basin', cat: 'Bath', w: 2, d: 1, p: 450, parts: [b(0, 0, 0, 2, .8, .9, '#d9d2c4'), b(0, 0, .9, 2, .8, .06, '#f4f4f4'), b(.7, .2, .96, .6, .4, .02, '#cfe3ee'), b(.3, 0, 1.2, 1.4, .04, .9, '#cfe8f2')] },
        { id: 'shower', n: 'Shower Enclosure', cat: 'Bath', w: 1, d: 1, p: 700, parts: [b(0, 0, 0, 1, 1, .08, '#dde3e8'), ln(0, 1, .08, 0, 1, 2.5, '#9fc4d8', 2), ln(1, 1, .08, 1, 1, 2.5, '#9fc4d8', 2), ln(1, 0, .08, 1, 0, 2.5, '#9fc4d8', 2), ln(0, 1, 2.5, 1, 1, 2.5, '#9fc4d8', 2), ln(1, 1, 2.5, 1, 0, 2.5, '#9fc4d8', 2), ln(.5, 0, 2.5, .5, 0, 2.2, '#7a8a95', 2)] },
        { id: 'washer', n: 'Washing Machine', cat: 'Bath', w: 1, d: 1, p: 640, parts: [b(0, 0, 0, 1, 1, 1.1, '#e8eaed'), dot(.5, 1, .55, .27, '#8fa6b6'), dot(.5, 1, .55, .17, '#c3d2dc')] },
        { id: 'plant', n: 'Indoor Plant', cat: 'Decor', w: 1, d: 1, p: 60, parts: [b(.3, .3, 0, .4, .4, .35, '#b5693f'), dot(.5, .5, .85, .36, '#3f8a4a'), dot(.4, .55, 1.15, .28, '#4aa05a'), dot(.6, .45, 1.4, .24, '#3a7d44')] },
        { id: 'lamp', n: 'Floor Lamp', cat: 'Decor', w: 1, d: 1, p: 90, parts: [b(.35, .35, 0, .3, .3, .05, '#444'), ln(.5, .5, .05, .5, .5, 2, '#555', 2), dot(.5, .5, 2.1, .3, '#f2d98a')] },
        { id: 'shoe', n: 'Shoe Cabinet', cat: 'Decor', w: 2, d: 1, p: 260, parts: [b(0, 0, 0, 2, .6, 1.0, '#b69b78'), ln(.05, .6, .5, 1.95, .6, .5, '#00000050'), ln(1, .6, .05, 1, .6, .95, '#00000050')] },
        { id: 'stairs', n: 'Staircase', cat: 'Decor', w: 2, d: 4, p: 1800, parts: stairs() }
    ];
    var CATS = ['Living', 'Kitchen', 'Dining', 'Bedroom', 'Bath', 'Decor'];

    /* ------------------------------------------------------------------ state */
    var S = { step: 0, layout: 2, bound: 0, items: [], wall: 0, wallHex: '#f4efe6', wallName: 'Warm White', floorType: 'marble', floor: 0, roof: 1, roofCol: 0, facade: 0, showRoof: false, seeThru: true, sea: false, sel: -1, pick: null, pickRot: 0, ghost: null, cat: 'Living' };
    var undoStack = [], insp = null, inspJpeg = null, VIEW = { ox: 0, oy: 0, k: 1 };
    var L = function () { return LAYOUTS[S.layout]; };

    /* ------------------------------------------------------------------ drawing helpers */
    function rng(seed) { var a = seed >>> 0; return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function rgb(h) { h = String(h); if (h.charAt(0) === 'r') { var m = h.match(/\d+/g); return [+m[0], +m[1], +m[2]]; } h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
    function shade(h, f) { var c = rgb(h); return 'rgb(' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); }).join(',') + ')'; }
    function P(x, y, z) { return [V.ox + (x - y) * A * V.k, V.oy + ((x + y) * B - (z || 0) * C) * V.k]; }
    function poly(pts, fill, stroke, lw) {
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = (lw || 1) * Math.max(.6, V.k); ctx.stroke(); }
    }
    function box(x, y, z, w, d, h, col) {
        var ed = 'rgba(0,0,0,.2)';
        poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(col, .9), ed, .7);
        poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], shade(col, .72), ed, .7);
        poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(col, 1.1), ed, .7);
    }
    function line3(a, bb, col, lw) { var p = P(a[0], a[1], a[2]), q = P(bb[0], bb[1], bb[2]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = col; ctx.lineWidth = (lw || 1) * Math.max(.6, V.k); ctx.stroke(); }
    function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

    /* ---- furniture parts in local coordinates (front = +local y); rot 1 turns the item 90 degrees */
    function dims(it, rot) { return rot ? [it.d, it.w] : [it.w, it.d]; }
    function drawItem(it, x, y, rot) {
        var w = it.w;
        function Lc(lx, ly) { return rot ? [x + ly, y + (w - lx)] : [x + lx, y + ly]; }
        it.parts.forEach(function (p) {
            if (p[0] === 'b') {
                var wx, wy, ww, wd;
                if (!rot) { wx = x + p[1]; wy = y + p[2]; ww = p[4]; wd = p[5]; } else { wx = x + p[2]; wy = y + (w - p[1] - p[4]); ww = p[5]; wd = p[4]; }
                box(wx, wy, p[3], ww, wd, p[6], p[7]);
            } else if (p[0] === 'l') {
                var a = Lc(p[1], p[2]), q = Lc(p[4], p[5]);
                line3([a[0], a[1], p[3]], [q[0], q[1], p[6]], p[7], p[8]);
            } else if (p[0] === 'o') {
                var c = Lc(p[1], p[2]), s = P(c[0], c[1], p[3]);
                ctx.beginPath(); ctx.ellipse(s[0], s[1], p[4] * A * V.k * 1.1, p[4] * A * V.k * .85, 0, 0, 6.2832);
                ctx.fillStyle = shade(p[5], 1); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = .7 * Math.max(.6, V.k); ctx.stroke();
            }
        });
    }
    function footprint(it, x, y, rot, col, alpha) {
        var d = dims(it, rot);
        ctx.save(); ctx.globalAlpha = alpha == null ? .5 : alpha;
        poly([P(x, y, .02), P(x + d[0], y, .02), P(x + d[0], y + d[1], .02), P(x, y + d[1], .02)], col, col, 1.5);
        ctx.restore();
    }

    /* ---- floor textures, drawn in tile units */
    function marbleTex(g, W, H, m, seed) {
        g.fillStyle = m.c; g.fillRect(0, 0, W, H);
        var r = rng(seed || 7), lg = g.createLinearGradient(0, 0, W, H);
        lg.addColorStop(0, 'rgba(255,255,255,.18)'); lg.addColorStop(.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.12)');
        g.fillStyle = lg; g.fillRect(0, 0, W, H);
        var n = Math.round(10 + W * H * .22);
        g.lineCap = 'round';
        for (var i = 0; i < n; i++) {
            var x = r() * W, y = r() * H, a = r() * 6.28, len = .8 + r() * 3.2;
            g.beginPath(); g.moveTo(x, y);
            g.bezierCurveTo(x + Math.cos(a) * len * .4 + (r() - .5), y + Math.sin(a) * len * .4 + (r() - .5), x + Math.cos(a) * len * .7 + (r() - .5), y + Math.sin(a) * len * .7 + (r() - .5), x + Math.cos(a) * len, y + Math.sin(a) * len);
            g.strokeStyle = m.v; g.globalAlpha = .12 + r() * .4; g.lineWidth = .015 + r() * .05; g.stroke();
        }
        g.globalAlpha = 1;
    }
    function woodTex(g, W, H, w, seed) {
        var r = rng(seed || 11), pw = .42, i = 0;
        for (var y = 0; y < H; y += pw, i++) {
            for (var x = -r() * 2; x < W; x += 2.2 + r() * 1.6) {
                var f = .9 + r() * .2; g.fillStyle = shade(w.c, f); g.fillRect(x, y, 3.8, pw);
                g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = .02; g.strokeRect(x, y, 3.8, pw);
                g.strokeStyle = 'rgba(0,0,0,.09)'; g.lineWidth = .012;
                for (var k = 0; k < 3; k++) { var gy = y + pw * (.2 + .3 * k); g.beginPath(); g.moveTo(x, gy); g.bezierCurveTo(x + 1, gy + .05, x + 2, gy - .05, x + 3.8, gy); g.stroke(); }
            }
        }
        var gl = g.createLinearGradient(0, 0, W, H); gl.addColorStop(0, 'rgba(255,255,255,.14)'); gl.addColorStop(1, 'rgba(0,0,0,.1)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    }
    function floorTex(g, W, H, type, idx) { if (type === 'wood') woodTex(g, W, H, WOOD[idx], 11 + idx); else marbleTex(g, W, H, MARBLE[idx], 7 + idx * 3); }

    /* ---- boundary patterns, drawn in local wall coordinates: u along the wall (tiles), v up (height units) */
    function bpat(bd, len, h) {
        var r = rng(bd.n.length * 97 + Math.round(len * 13)), c1 = bd.c1, c2 = bd.c2, u, v, i, row;
        function fr(x, y, w, hh, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, hh); }
        function ln2(x1, y1, x2, y2, c, w) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); }
        var pat = bd.pat;
        if (pat === 'brick' || pat === 'block') {
            fr(0, 0, len, h, c1); var bh = pat === 'brick' ? .12 : .3, bw = pat === 'brick' ? .3 : .75;
            for (v = 0, row = 0; v < h; v += bh, row++) { ln2(0, v, len, v, c2, .022); for (u = (row % 2) * bw / 2; u < len; u += bw) ln2(u, v, u, Math.min(h, v + bh), c2, .022); }
        } else if (pat === 'stone' || pat === 'cobble') {
            fr(0, 0, len, h, c1); var sh = pat === 'stone' ? .24 : .14;
            for (v = 0; v < h; v += sh) { u = 0; while (u < len) { var sw = (pat === 'stone' ? .35 : .18) + r() * .3; ctx.fillStyle = shade(c1, .86 + r() * .3); ctx.fillRect(u + .01, v + .01, sw - .02, sh - .02); ctx.strokeStyle = c2; ctx.lineWidth = .02; ctx.strokeRect(u + .01, v + .01, sw - .02, sh - .02); u += sw; } }
        } else if (pat === 'plain') {
            fr(0, 0, len, h, c1); fr(0, 0, len, .1, c2); for (u = 1; u < len; u += 1.5) ln2(u, .1, u, h, 'rgba(0,0,0,.06)', .02);
        } else if (pat === 'picket') {
            ln2(0, h * .3, len, h * .3, c2, .05); ln2(0, h * .72, len, h * .72, c2, .05);
            for (u = .04; u < len; u += .2) { fr(u, 0, .15, h * .9, c1); ctx.beginPath(); ctx.moveTo(u, h * .9); ctx.lineTo(u + .075, h); ctx.lineTo(u + .15, h * .9); ctx.fillStyle = c1; ctx.fill(); ln2(u + .15, 0, u + .15, h * .9, c2, .015); }
        } else if (pat === 'bamboo') {
            for (u = 0; u < len; u += .1) { fr(u, 0, .09, h, i = (Math.round(u * 10) % 2 ? c1 : c2)); }
            for (v = .3; v < h; v += .4) ln2(0, v, len, v, 'rgba(60,70,20,.55)', .03);
            ln2(0, h * .25, len, h * .25, '#5a4a28', .06); ln2(0, h * .75, len, h * .75, '#5a4a28', .06);
        } else if (pat === 'bars' || pat === 'spears' || pat === 'pillars') {
            ln2(0, h * .12, len, h * .12, c1, .07); ln2(0, h * .86, len, h * .86, c1, .07);
            for (u = .08; u < len; u += .24) { ln2(u, 0, u, h * .9, c1, .035); if (pat === 'spears') { ctx.beginPath(); ctx.moveTo(u - .05, h * .9); ctx.lineTo(u, h); ctx.lineTo(u + .05, h * .9); ctx.fillStyle = c1; ctx.fill(); } }
            if (pat === 'pillars') { for (u = 0; u <= len + .01; u += 2) { fr(Math.min(u, len - .3), 0, .3, h, c2); fr(Math.min(u, len - .3) - .03, h - .12, .36, .12, bd.cap); } }
        } else if (pat === 'glass') {
            fr(0, 0, len, h, 'rgba(159,208,230,.38)'); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * .3, 0); ctx.lineTo(len * .3 + h * .6, h); ctx.lineTo(h * .6, h); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill();
            for (u = 0; u <= len + .01; u += 1.5) ln2(Math.min(u, len), 0, Math.min(u, len), h, '#6f8fa0', .04); ln2(0, h, len, h, '#6f8fa0', .05); ln2(0, .03, len, .03, '#6f8fa0', .05);
        } else if (pat === 'hedge') {
            fr(0, 0, len, h, c1);
            for (i = 0; i < len * h * 40; i++) { ctx.beginPath(); ctx.arc(r() * len, r() * h, .05 + r() * .09, 0, 6.3); ctx.fillStyle = shade(c2, .7 + r() * .6); ctx.fill(); }
        } else if (pat === 'mesh') {
            for (u = -h; u < len + h; u += .16) { ln2(u, 0, u + h, h, c1, .012); ln2(u + h, 0, u, h, c1, .012); }
            for (u = 0; u <= len + .01; u += 2) ln2(Math.min(u, len), 0, Math.min(u, len), h, c2, .05); ln2(0, h, len, h, c2, .04);
        } else if (pat === 'slats') {
            for (v = 0; v < h; v += .17) fr(0, v, len, .145, shade(c1, .86 + r() * .28));
            for (u = 0; u <= len + .01; u += 2) fr(Math.min(u, len - .08), 0, .08, h, c2);
        } else if (pat === 'trellis') {
            for (u = -h; u < len + h; u += .3) { ln2(u, 0, u + h, h, c1, .03); ln2(u + h, 0, u, h, c1, .03); }
            for (i = 0; i < len * 14; i++) { ctx.beginPath(); ctx.arc(r() * len, h * (.25 + r() * .75), .05 + r() * .06, 0, 6.3); ctx.fillStyle = shade(c2, .7 + r() * .6); ctx.fill(); }
            ln2(0, 0, len, 0, c1, .06); ln2(0, h, len, h, c1, .06);
        }
        if (pat !== 'bars' && pat !== 'spears' && pat !== 'glass' && pat !== 'mesh' && pat !== 'hedge' && pat !== 'picket' && pat !== 'trellis' && pat !== 'bamboo') fr(0, h - .07, len, .07, bd.cap);
    }
    /* draw a vertical wall segment (x1<=x2, y1<=y2, axis aligned) with a pattern painted in wall-local coordinates */
    function wallPlane(x1, y1, x2, y2, h, fn, alpha) {
        var alongX = x2 > x1, len = alongX ? x2 - x1 : y2 - y1, p0 = P(x1, y1, 0);
        ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
        var a = P(x1, y1, 0), c = P(x2, y2, 0), d = P(x2, y2, h), e = P(x1, y1, h);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath(); ctx.clip();
        ctx.transform((alongX ? A : -A) * V.k, B * V.k, 0, -C * V.k, p0[0], p0[1]);
        fn(len, h);
        ctx.restore();
    }
    function boundarySeg(x1, y1, x2, y2, bd, h, alpha) { wallPlane(x1, y1, x2, y2, h, function (len, hh) { bpat(bd, len, hh); }, alpha); var t = P(x1, y1, h), u = P(x2, y2, h); ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(u[0], u[1]); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1 * Math.max(.6, V.k); ctx.stroke(); }

    /* ------------------------------------------------------------------ scene */
    function itemDef(id) { for (var i = 0; i < F.length; i++) if (F[i].id === id) return F[i]; return null; }
    function inFloor(l, x, y) {
        if (x < 0 || y < 0 || x >= l.cols || y >= l.rows) return false;
        var c = l.cut; return !(c && x >= c[0] && x < c[0] + c[2] && y >= c[1] && y < c[1] + c[3]);
    }
    function cellCount(l) { var n = 0, x, y; for (x = 0; x < l.cols; x++) for (y = 0; y < l.rows; y++) if (inFloor(l, x, y)) n++; return n; }
    function segs(l) { return (l.seg || []).filter(function (s) { return s[0] !== s[2] || s[1] !== s[3]; }); }
    function cutWalls(l) {
        var o = [], c = l.cut, x, y; if (!c) return o;
        for (x = c[0]; x < c[0] + c[2]; x++) { if (inFloor(l, x, c[1] - 1)) o.push([x, c[1], x + 1, c[1]]); if (inFloor(l, x, c[1] + c[3])) o.push([x, c[1] + c[3], x + 1, c[1] + c[3]]); }
        for (y = c[1]; y < c[1] + c[3]; y++) { if (inFloor(l, c[0] - 1, y)) o.push([c[0], y, c[0], y + 1]); if (inFloor(l, c[0] + c[2], y)) o.push([c[0] + c[2], y, c[0] + c[2], y + 1]); }
        return o;
    }
    function gateX(l) { return Math.floor(l.cols / 2) - 1; }

    function drawBackground(g, W, H) {
        var dark = isDark(), hor = H * .4;
        var sky = g.createLinearGradient(0, 0, 0, H);
        if (dark) { sky.addColorStop(0, '#0a1330'); sky.addColorStop(.6, '#1c3358'); sky.addColorStop(1, '#27456f'); } else { sky.addColorStop(0, '#86c4f3'); sky.addColorStop(.55, '#c9e6fb'); sky.addColorStop(1, '#eaf5ff'); }
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        if (dark) { var r = rng(5); g.fillStyle = 'rgba(255,255,255,.75)'; for (var i = 0; i < 46; i++) { g.beginPath(); g.arc(r() * W, r() * H * .5, r() * 1.3 + .3, 0, 6.3); g.fill(); } }
        if (S.sea) {
            var sea = g.createLinearGradient(0, hor, 0, H); sea.addColorStop(0, dark ? '#16477a' : '#4fb3e6'); sea.addColorStop(1, dark ? '#0c2a4d' : '#1f86c8');
            g.fillStyle = sea; g.fillRect(0, hor, W, H - hor);
            var sg = g.createRadialGradient(W * .78, hor, 4, W * .78, hor, W * .22); sg.addColorStop(0, dark ? 'rgba(220,230,255,.55)' : 'rgba(255,238,170,.9)'); sg.addColorStop(1, 'rgba(255,238,170,0)');
            g.fillStyle = sg; g.fillRect(0, 0, W, hor + 40);
            g.beginPath(); g.arc(W * .78, hor - 26, 20, 0, 6.3); g.fillStyle = dark ? '#f1f5ff' : '#fff4c2'; g.fill();
            g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; var q = rng(9);
            for (var j = 0; j < 36; j++) { var wx = q() * W, wy = hor + 10 + q() * (H - hor - 20), wl = 20 + q() * 50; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + wl / 2, wy - 5, wx + wl, wy); g.stroke(); }
        } else {
            var gr = g.createLinearGradient(0, H * .45, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, dark ? 'rgba(20,50,35,.55)' : 'rgba(120,190,110,.35)');
            g.fillStyle = gr; g.fillRect(0, H * .45, W, H * .55);
        }
    }
    function drawGround(l) {
        var x0 = -M, y0 = -M, x1 = l.cols + M, y1 = l.rows + M, dark = isDark();
        poly([P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)], S.sea ? '#e6d4a6' : (dark ? '#2d5c3c' : '#7dbd6c'), 'rgba(0,0,0,.25)', 1.2);
        poly([P(x0 + .4, y0 + .4, 0), P(x1 - .4, y0 + .4, 0), P(x1 - .4, y1 - .4, 0), P(x0 + .4, y1 - .4, 0)], S.sea ? '#efdfb4' : (dark ? '#356b46' : '#8ccb7a'));
        var gx = gateX(l); poly([P(gx + .1, l.rows, 0), P(gx + 1.9, l.rows, 0), P(gx + 1.9, y1, 0), P(gx + .1, y1, 0)], '#cfc9bc', 'rgba(0,0,0,.2)');
        for (var y = l.rows + .8; y < y1; y += .8) line3([gx + .1, y, 0], [gx + 1.9, y, 0], 'rgba(0,0,0,.12)', .8);
        if (l.cut && l.id === 'court') {
            var c = l.cut; poly([P(c[0], c[1], 0), P(c[0] + c[2], c[1], 0), P(c[0] + c[2], c[1] + c[3], 0), P(c[0], c[1] + c[3], 0)], dark ? '#3c7a50' : '#92d27f');
            var cx = c[0] + c[2] / 2, cy = c[1] + c[3] / 2; box(cx - .12, cy - .12, 0, .24, .24, 1.2, '#6b4a30');
            [[0, 0, 1.9, .95], [-.3, .15, 1.6, .8], [.3, .1, 1.5, .75]].forEach(function (e) { var s = P(cx + e[0], cy + e[1], e[2]); ctx.beginPath(); ctx.ellipse(s[0], s[1], A * V.k * e[3], A * V.k * e[3] * .78, 0, 0, 6.3); ctx.fillStyle = '#3f8a4a'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke(); });
        }
    }
    function drawFloor(l) {
        var x, y, fac = FACADES[S.facade][1];
        for (x = 0; x < l.cols; x++) for (y = 0; y < l.rows; y++) {
            if (!inFloor(l, x, y)) continue;
            if (!inFloor(l, x, y + 1)) poly([P(x, y + 1, -.3), P(x + 1, y + 1, -.3), P(x + 1, y + 1, 0), P(x, y + 1, 0)], shade(fac, .88), 'rgba(0,0,0,.18)', .6);
            if (!inFloor(l, x + 1, y)) poly([P(x + 1, y, -.3), P(x + 1, y + 1, -.3), P(x + 1, y + 1, 0), P(x + 1, y, 0)], shade(fac, .7), 'rgba(0,0,0,.18)', .6);
        }
        ctx.save();
        ctx.transform(A * V.k, B * V.k, -A * V.k, B * V.k, V.ox, V.oy);
        ctx.beginPath(); for (x = 0; x < l.cols; x++) for (y = 0; y < l.rows; y++) if (inFloor(l, x, y)) ctx.rect(x, y, 1.001, 1.001);
        ctx.clip();
        floorTex(ctx, l.cols, l.rows, S.floorType, S.floor);
        l.rooms.forEach(function (r) { ctx.globalAlpha = .26; ctx.fillStyle = r[4]; ctx.fillRect(r[0], r[1], r[2], r[3]); });
        ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(0,0,0,.11)'; ctx.lineWidth = .02;
        for (x = 0; x <= l.cols; x++) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, l.rows); ctx.stroke(); }
        for (y = 0; y <= l.rows; y++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(l.cols, y); ctx.stroke(); }
        ctx.restore();
    }
    function drawBackWalls(l) {
        var fac = FACADES[S.facade][1], wc = S.wallHex, t = .25, dark = isDark();
        function paint(f) {
            return function (len, h) {
                ctx.fillStyle = shade(wc, f); ctx.fillRect(0, 0, len, h);
                var gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.14)'); gr.addColorStop(.35, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,.08)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, len, h);
                ctx.fillStyle = shade(wc, f * .78); ctx.fillRect(0, 0, len, .16);
                var n = Math.max(1, Math.floor(len / 4)), i;
                for (i = 0; i < n; i++) {
                    var cx = len * (i + .5) / n, w = 1.6, g2 = ctx.createLinearGradient(0, 1.1, 0, 2.6);
                    g2.addColorStop(0, S.sea ? '#b4e0f6' : '#d6ebf8'); g2.addColorStop(1, S.sea ? '#4fb3e6' : '#9cc9e8');
                    ctx.fillStyle = g2; ctx.fillRect(cx - w / 2, 1.1, w, 1.5);
                    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .07; ctx.strokeRect(cx - w / 2, 1.1, w, 1.5);
                    ctx.lineWidth = .04; ctx.beginPath(); ctx.moveTo(cx, 1.1); ctx.lineTo(cx, 2.6); ctx.stroke();
                }
            };
        }
        wallPlane(0, 0, l.cols, 0, WH, paint(.97));
        wallPlane(0, 0, 0, l.rows, WH, paint(.84));
        poly([P(-t, -t, WH), P(l.cols, -t, WH), P(l.cols, 0, WH), P(-t, 0, WH)], shade(fac, 1.04), 'rgba(0,0,0,.2)', .7);
        poly([P(-t, 0, WH), P(0, 0, WH), P(0, l.rows, WH), P(-t, l.rows, WH)], shade(fac, 1.0), 'rgba(0,0,0,.2)', .7);
        poly([P(l.cols, -t, 0), P(l.cols, 0, 0), P(l.cols, 0, WH), P(l.cols, -t, WH)], shade(fac, .72), 'rgba(0,0,0,.2)', .7);
        poly([P(-t, l.rows, 0), P(0, l.rows, 0), P(0, l.rows, WH), P(-t, l.rows, WH)], shade(fac, .88), 'rgba(0,0,0,.2)', .7);
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = dark ? 'rgba(255,255,255,.36)' : 'rgba(15,23,42,.3)'; ctx.lineWidth = 1.3 * Math.max(.7, V.k);
        [[[0, l.rows, 0], [0, l.rows, WH]], [[l.cols, l.rows, 0], [l.cols, l.rows, WH]], [[l.cols, 0, 0], [l.cols, 0, WH]], [[0, l.rows, WH], [l.cols, l.rows, WH]], [[l.cols, l.rows, WH], [l.cols, 0, WH]]].forEach(function (e) { line3(e[0], e[1], ctx.strokeStyle, 1.3); });
        ctx.restore();
    }
    function drawBalcony(l) {
        var x0 = 1, x1 = l.cols - 1, y0 = l.rows, y1 = l.rows + 2, gl = BOUNDS[9];
        box(x0, y0, -.3, x1 - x0, y1 - y0, .3, '#c9a06b');
        ctx.save(); ctx.transform(A * V.k, B * V.k, -A * V.k, B * V.k, V.ox, V.oy); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); woodTex(ctx, l.cols, l.rows + 3, { c: '#d3ad78' }, 3); ctx.restore();
        wallPlane(x0, y0, x0, y1, 1.15, function (len, h) { bpat(gl, len, h); }, .95);
        box(x0 + 1.4, y0 + .6, 0, .8, .8, .72, '#efe7d6'); box(x0 + .6, y0 + .7, 0, .45, .45, .5, '#7a5a3a'); box(x0 + 2.5, y0 + .7, 0, .45, .45, .5, '#7a5a3a');
        wallPlane(x0, y1, x1, y1, 1.15, function (len, h) { bpat(gl, len, h); }, .9);
        wallPlane(x1, y0, x1, y1, 1.15, function (len, h) { bpat(gl, len, h); }, .9);
    }
    function drawRoofShape(id, col, cols, rows, alpha, z0) {
        var ov = .5, x0 = -ov, x1 = cols + ov, y0 = -ov, y1 = rows + ov, ym = rows / 2, z = z0, rh = RH, ed = 'rgba(0,0,0,.28)';
        ctx.save(); ctx.globalAlpha = alpha;
        if (id === 'flat') { box(x0, y0, z, x1 - x0, y1 - y0, .3, col); }
        else if (id === 'gable') {
            poly([P(x0, y0, z), P(x1, y0, z), P(x1, ym, z + rh), P(x0, ym, z + rh)], shade(col, .82), ed, 1);
            poly([P(x0, y1, z), P(x1, y1, z), P(x1, ym, z + rh), P(x0, ym, z + rh)], shade(col, 1.0), ed, 1);
            poly([P(x1, y0, z), P(x1, y1, z), P(x1, ym, z + rh)], shade(col, .68), ed, 1);
        } else if (id === 'hip') {
            var xl = cols * .28, xr = cols * .72;
            poly([P(x0, y0, z), P(x1, y0, z), P(xr, ym, z + rh), P(xl, ym, z + rh)], shade(col, .82), ed, 1);
            poly([P(x0, y0, z), P(x0, y1, z), P(xl, ym, z + rh)], shade(col, .9), ed, 1);
            poly([P(x0, y1, z), P(x1, y1, z), P(xr, ym, z + rh), P(xl, ym, z + rh)], shade(col, 1.0), ed, 1);
            poly([P(x1, y0, z), P(x1, y1, z), P(xr, ym, z + rh)], shade(col, .7), ed, 1);
        } else if (id === 'shed') {
            poly([P(x0, y0, z + rh), P(x1, y0, z + rh), P(x1, y1, z), P(x0, y1, z)], shade(col, 1.0), ed, 1);
            poly([P(x1, y0, z), P(x1, y1, z), P(x1, y0, z + rh)], shade(col, .68), ed, 1);
        } else if (id === 'butterfly') {
            poly([P(x0, y0, z + rh), P(x1, y0, z + rh), P(x1, ym, z), P(x0, ym, z)], shade(col, 1.04), ed, 1);
            poly([P(x0, y1, z + rh), P(x1, y1, z + rh), P(x1, ym, z), P(x0, ym, z)], shade(col, .8), ed, 1);
        }
        ctx.restore();
    }
    function allEntries(l) {
        var e = [], wc = S.wallHex;
        segs(l).forEach(function (s) { var key = (s[0] + s[2]) / 2 + (s[1] + s[3]) / 2; e.push({ key: key, draw: function () { if (s[1] === s[3]) box(s[0], s[1] - .06, 0, s[2] - s[0], .12, 1.5, shade(wc, 1.02)); else box(s[0] - .06, s[1], 0, .12, s[3] - s[1], 1.5, shade(wc, .96)); } }); });
        cutWalls(l).forEach(function (s) { var key = (s[0] + s[2]) / 2 + (s[1] + s[3]) / 2; e.push({ key: key, draw: function () { if (s[1] === s[3]) box(s[0], s[1] - .05, 0, s[2] - s[0], .1, 1.0, shade(wc, 1.05)); else box(s[0] - .05, s[1], 0, .1, s[3] - s[1], 1.0, shade(wc, .95)); } }); });
        S.items.forEach(function (it, i) {
            var d = itemDef(it.id); if (!d || d.flat) return; var dm = dims(d, it.rot);
            e.push({ key: it.x + dm[0] / 2 + it.y + dm[1] / 2 + .001, draw: function () { drawItem(d, it.x, it.y, it.rot); if (i === S.sel) footprint(d, it.x, it.y, it.rot, '#10b981', .38); } });
        });
        e.sort(function (a, b2) { return a.key - b2.key; });
        return e;
    }
    function renderScene(g, W, H, showUi) {
        var prev = ctx, pv = { ox: V.ox, oy: V.oy, k: V.k }; ctx = g;
        try {
            var l = L(), x0 = -M, y0 = -M, x1 = l.cols + M, y1 = l.rows + M;
            V.ox = 0; V.oy = 0; V.k = 1;
            var pts = [P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0), P(0, 0, WH + RH + .6), P(l.cols, l.rows, 0)], mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
            pts.forEach(function (p) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); });
            V.k = Math.min(W * .95 / (mxx - mnx), H * .93 / (mxy - mny));
            V.ox = W / 2 - (mnx + mxx) / 2 * V.k; V.oy = H / 2 - (mny + mxy) / 2 * V.k + 4;
            if (showUi) VIEW = { ox: V.ox, oy: V.oy, k: V.k };
            drawBackground(g, W, H);
            drawGround(l);
            var bd = BOUNDS[S.bound];
            boundarySeg(x0, y0, x1, y0, bd, bd.h, 1); boundarySeg(x0, y0, x0, y1, bd, bd.h, 1);
            drawFloor(l); drawBackWalls(l);
            S.items.forEach(function (it) { var d = itemDef(it.id); if (d && d.flat) drawItem(d, it.x, it.y, it.rot); });
            allEntries(l).forEach(function (en) { en.draw(); });
            if (showUi && S.pick && S.ghost) {
                var pd = itemDef(S.pick); footprint(pd, S.ghost.x, S.ghost.y, S.pickRot, S.ghost.ok ? '#10b981' : '#ef4444', .45);
                ctx.save(); ctx.globalAlpha = .72; drawItem(pd, S.ghost.x, S.ghost.y, S.pickRot); ctx.restore();
            }
            if (showUi && S.sel >= 0 && S.items[S.sel]) { var si = S.items[S.sel], sd = itemDef(si.id); if (sd && sd.flat) footprint(sd, si.x, si.y, si.rot, '#10b981', .38); }
            if (S.sea) drawBalcony(l);
            if (S.showRoof) drawRoofShape(ROOFS[S.roof].id, ROOFCOLS[S.roofCol][1], l.cols, l.rows, S.seeThru ? .4 : 1, WH);
            var gx = gateX(l), nh = Math.min(bd.h, .6);
            boundarySeg(x1, y0, x1, y1, bd, nh, .94);
            if (gx > -M) boundarySeg(x0, y1, gx, y1, bd, nh, .94);
            boundarySeg(gx + 2, y1, x1, y1, bd, nh, .94);
            box(gx - .12, y1 - .12, 0, .3, .3, nh + .55, '#8b8478'); box(gx + 1.82, y1 - .12, 0, .3, .3, nh + .55, '#8b8478');
        } finally { ctx = prev; V.ox = pv.ox; V.oy = pv.oy; V.k = pv.k; }
    }

    /* ------------------------------------------------------------------ costs */
    function costs() {
        var l = L(), cells = cellCount(l), area = cells * T * T, sqft = area * 10.764;
        var per = 2 * ((l.cols + 2 * M) + (l.rows + 2 * M)) * T - 1.5, partLen = segs(l).reduce(function (a, s) { return a + Math.abs(s[2] - s[0]) + Math.abs(s[3] - s[1]); }, 0);
        var wallArea = ((l.cols + l.rows) * T + partLen * T * 2) * WH * T;
        var fl = S.floorType === 'wood' ? WOOD[S.floor] : MARBLE[S.floor], rf = ROOFS[S.roof];
        var furn = 0; S.items.forEach(function (it) { var d = itemDef(it.id); if (d) furn += d.p; });
        var o = { base: sqft * 185, boundary: per * BOUNDS[S.bound].p, furniture: furn, walls: wallArea * 8.5, floor: area * fl.p, roof: S.showRoof ? area * 1.15 * rf.r : 0, balcony: S.sea ? 9500 : 0, areaM2: area };
        o.total = o.base + o.boundary + o.furniture + o.walls + o.floor + o.roof + o.balcony; return o;
    }
    function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }

    /* ------------------------------------------------------------------ interaction helpers */
    function pushUndo() { undoStack.push(JSON.stringify(S.items)); if (undoStack.length > 60) undoStack.shift(); }
    function overlap(a, ad, b2, bd) { return a.x < b2.x + bd[0] && a.x + ad[0] > b2.x && a.y < b2.y + bd[1] && a.y + ad[1] > b2.y; }
    function canPlace(def, x, y, rot, ignore) {
        var l = L(), dm = dims(def, rot), i, j;
        for (i = 0; i < dm[0]; i++) for (j = 0; j < dm[1]; j++) if (!inFloor(l, x + i, y + j)) return false;
        if (def.flat) return true;
        for (i = 0; i < S.items.length; i++) {
            if (i === ignore) continue; var o = S.items[i], od = itemDef(o.id); if (!od || od.flat) continue;
            if (overlap({ x: x, y: y }, dm, o, dims(od, o.rot))) return false;
        }
        return true;
    }
    function toCanvas(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }
    function toGrid(p) { var sx = (p[0] - VIEW.ox) / VIEW.k, sy = (p[1] - VIEW.oy) / VIEW.k; return [(sy / B + sx / A) / 2, (sy / B - sx / A) / 2]; }
    function inPoly(p, pts) { var c = false, i, j; for (i = 0, j = pts.length - 1; i < pts.length; j = i++) { if (((pts[i][1] > p[1]) !== (pts[j][1] > p[1])) && (p[0] < (pts[j][0] - pts[i][0]) * (p[1] - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0])) c = !c; } return c; }
    function hmax(d) { if (d._h == null) { d._h = .2; d.parts.forEach(function (p) { if (p[0] === 'b') d._h = Math.max(d._h, p[3] + p[6]); else if (p[0] === 'o') d._h = Math.max(d._h, p[3] + p[4] * 1.2); else d._h = Math.max(d._h, p[3], p[6]); }); } return d._h; }
    function hitItem(p) {
        var save = { ox: V.ox, oy: V.oy, k: V.k }; V.ox = VIEW.ox; V.oy = VIEW.oy; V.k = VIEW.k; var found = -1;
        var order = S.items.map(function (it, i) { var d = itemDef(it.id), dm = d ? dims(d, it.rot) : [0, 0]; return { i: i, key: it.x + dm[0] / 2 + it.y + dm[1] / 2 + (d && d.flat ? -100 : 0) }; }).sort(function (a, b2) { return b2.key - a.key; });
        for (var n = 0; n < order.length && found < 0; n++) {
            var it = S.items[order[n].i], d = itemDef(it.id); if (!d) continue; var dm = dims(d, it.rot), h = d.flat ? .05 : hmax(d), x = it.x, y = it.y;
            var faces = [[P(x, y, h), P(x + dm[0], y, h), P(x + dm[0], y + dm[1], h), P(x, y + dm[1], h)], [P(x, y + dm[1], 0), P(x + dm[0], y + dm[1], 0), P(x + dm[0], y + dm[1], h), P(x, y + dm[1], h)], [P(x + dm[0], y, 0), P(x + dm[0], y + dm[1], 0), P(x + dm[0], y + dm[1], h), P(x + dm[0], y, h)]];
            for (var f = 0; f < 3; f++) if (inPoly(p, faces[f])) { found = order[n].i; break; }
        }
        V.ox = save.ox; V.oy = save.oy; V.k = save.k; return found;
    }

    /* ------------------------------------------------------------------ drawing loop + UI refresh */
    var raf = 0;
    function draw() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; renderScene(ctx, cv.width, cv.height, true); refreshUi(); }); }
    function setHint(t) { $('bdHint').textContent = t; }
    function refreshUi() {
        var c = costs(), rows = [['Base structure & layout', c.base], ['Boundary & fencing', c.boundary], ['Furniture & appliances', c.furniture], ['Wall finish', c.walls], ['Flooring', c.floor], ['Roof', c.roof], ['Coastal view balcony', c.balcony]];
        $('bdCostList').innerHTML = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + money(r[1]) + '</dd></div>'; }).join('');
        $('bdTotal').textContent = money(c.total);
        $('bdRotate').disabled = !(S.sel >= 0 || S.pick); $('bdDelete').disabled = S.sel < 0; $('bdUndo').disabled = !undoStack.length;
    }
    function renderPlaced() {
        var ul = $('bdPlaced'); ul.innerHTML = ''; $('bdPlacedCount').textContent = S.items.length;
        S.items.forEach(function (it, i) {
            var d = itemDef(it.id); if (!d) return; var li = document.createElement('li'); if (i === S.sel) li.className = 'on';
            li.innerHTML = '<span></span><button type="button" aria-label="Remove ' + d.n + '">Remove</button>'; li.firstChild.textContent = d.n + ' · ' + money(d.p);
            li.firstChild.style.cursor = 'pointer'; li.firstChild.onclick = function () { S.sel = i; S.pick = null; renderPlaced(); draw(); };
            li.lastChild.onclick = function () { pushUndo(); S.items.splice(i, 1); S.sel = -1; renderPlaced(); save(); draw(); };
            ul.appendChild(li);
        });
    }
    function selectItem(i) { S.sel = i; if (i >= 0) { S.pick = null; markPick(); } renderPlaced(); draw(); }
    function removeSel() { if (S.sel < 0) return; pushUndo(); S.items.splice(S.sel, 1); S.sel = -1; renderPlaced(); save(); draw(); }
    function rotate() {
        if (S.sel >= 0) { var it = S.items[S.sel], d = itemDef(it.id), nr = it.rot ? 0 : 1, dm = dims(d, nr), nx = it.x, ny = it.y; if (canPlace(d, nx, ny, nr, S.sel)) { pushUndo(); it.rot = nr; save(); draw(); } else setHint('No room to rotate here.'); }
        else if (S.pick) { S.pickRot = S.pickRot ? 0 : 1; draw(); }
    }
    function undo() { if (!undoStack.length) return; S.items = JSON.parse(undoStack.pop()); S.sel = -1; renderPlaced(); save(); draw(); }
    function markPick() { var els = $('bdFurn').querySelectorAll('.bd-card'); Array.prototype.forEach.call(els, function (e) { e.classList.toggle('on', e.getAttribute('data-id') === S.pick); }); }

    cv.addEventListener('pointermove', function (e) {
        var p = toCanvas(e), g = toGrid(p);
        if (drag) { var d = itemDef(S.items[drag.i].id), dm = dims(d, S.items[drag.i].rot), nx = Math.round(g[0] - dm[0] / 2 - drag.dx), ny = Math.round(g[1] - dm[1] / 2 - drag.dy); if (canPlace(d, nx, ny, S.items[drag.i].rot, drag.i)) { S.items[drag.i].x = nx; S.items[drag.i].y = ny; drag.moved = true; } draw(); return; }
        if (S.pick) { var pd = itemDef(S.pick), pm = dims(pd, S.pickRot), x = Math.round(g[0] - pm[0] / 2), y = Math.round(g[1] - pm[1] / 2); S.ghost = { x: x, y: y, ok: canPlace(pd, x, y, S.pickRot) }; draw(); }
        else cv.style.cursor = hitItem(p) >= 0 ? 'grab' : 'default';
    });
    var drag = null;
    cv.addEventListener('pointerdown', function (e) {
        cv.focus({ preventScroll: true }); var p = toCanvas(e), g = toGrid(p);
        if (S.pick) {
            var pd = itemDef(S.pick), pm = dims(pd, S.pickRot), x = Math.round(g[0] - pm[0] / 2), y = Math.round(g[1] - pm[1] / 2);
            if (S.items.length >= 80) { setHint('Maximum 80 items per design.'); return; }
            if (canPlace(pd, x, y, S.pickRot)) { pushUndo(); S.items.push({ id: S.pick, x: x, y: y, rot: S.pickRot }); S.sel = S.items.length - 1; renderPlaced(); save(); setHint(pd.n + ' placed. Click again to add another, or press Esc.'); }
            else setHint('That spot is blocked or outside the floor.');
            draw(); return;
        }
        var h = hitItem(p);
        if (h >= 0) {
            var it = S.items[h], d = itemDef(it.id); selectItem(h); pushUndo(); drag = { i: h, dx: g[0] - it.x - dims(d, it.rot)[0] / 2, dy: g[1] - it.y - dims(d, it.rot)[1] / 2, moved: false };
            cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
        } else if (S.sel >= 0) { S.sel = -1; renderPlaced(); draw(); }
    });
    function endDrag() { if (drag) { if (!drag.moved) undoStack.pop(); else save(); drag = null; cv.style.cursor = 'default'; draw(); } }
    cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
    cv.addEventListener('pointerleave', function () { if (S.ghost) { S.ghost = null; draw(); } });
    cv.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'r' || k === 'R') { rotate(); e.preventDefault(); }
        else if (k === 'Delete' || k === 'Backspace') { removeSel(); e.preventDefault(); }
        else if (k === 'Escape') { S.pick = null; S.ghost = null; markPick(); setHint('Placement cancelled.'); draw(); }
        else if (S.sel >= 0 && k.indexOf('Arrow') === 0) {
            var it = S.items[S.sel], d = itemDef(it.id), dx = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0, dy = k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0;
            if (canPlace(d, it.x + dx, it.y + dy, it.rot, S.sel)) { pushUndo(); it.x += dx; it.y += dy; save(); draw(); } e.preventDefault();
        }
    });

    /* ------------------------------------------------------------------ thumbnails + panel UI */
    function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function tc(w, h) { var c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; c.style.aspectRatio = w + '/' + h; var g = c.getContext('2d'); g.scale(2, 2); return [c, g]; }
    function withCtx(g, fn) { var pc = ctx, pv = { ox: V.ox, oy: V.oy, k: V.k }; ctx = g; try { fn(); } finally { ctx = pc; V.ox = pv.ox; V.oy = pv.oy; V.k = pv.k; } }
    function fitTo(pts, W, H, pad) { var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; V.ox = 0; V.oy = 0; V.k = 1; pts.forEach(function (q) { var p = P(q[0], q[1], q[2]); mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); }); V.k = Math.min((W - pad * 2) / (mxx - mnx), (H - pad * 2) / (mxy - mny)); V.ox = W / 2 - (mnx + mxx) / 2 * V.k; V.oy = H / 2 - (mny + mxy) / 2 * V.k; }
    function layoutThumb(l) {
        var t = tc(120, 84), g = t[1], u = Math.min(104 / l.cols, 68 / l.rows), x, y; g.translate((120 - l.cols * u) / 2, (84 - l.rows * u) / 2);
        g.fillStyle = '#e8ecf1'; for (x = 0; x < l.cols; x++) for (y = 0; y < l.rows; y++) if (inFloor(l, x, y)) g.fillRect(x * u, y * u, u + .5, u + .5);
        l.rooms.forEach(function (r) { g.globalAlpha = .75; g.fillStyle = r[4]; g.save(); g.beginPath(); for (x = r[0]; x < r[0] + r[2]; x++) for (y = r[1]; y < r[1] + r[3]; y++) if (inFloor(l, x, y)) g.rect(x * u, y * u, u + .5, u + .5); g.fill(); g.restore(); });
        g.globalAlpha = 1; g.strokeStyle = '#475569'; g.lineWidth = 2; segs(l).forEach(function (s) { g.beginPath(); g.moveTo(s[0] * u, s[1] * u); g.lineTo(s[2] * u, s[3] * u); g.stroke(); });
        g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, l.rows * u); g.lineTo(0, 0); g.lineTo(l.cols * u, 0); g.stroke(); return t[0];
    }
    function boundThumb(bd) {
        var t = tc(120, 96), g = t[1]; withCtx(g, function () {
            g.fillStyle = '#dbeafe'; g.fillRect(0, 0, 120, 96); V.k = 1.0; V.ox = 22; V.oy = 54;
            poly([P(-.6, -.4, 0), P(2.8, -.4, 0), P(2.8, 1.4, 0), P(-.6, 1.4, 0)], '#7dbd6c'); boundarySeg(0, 0, 2.4, 0, bd, bd.h, 1);
        }); return t[0];
    }
    function itemThumb(d) {
        var t = tc(84, 64), g = t[1]; withCtx(g, function () {
            var h = hmax(d); fitTo([[0, 0, 0], [d.w, 0, 0], [d.w, d.d, 0], [0, d.d, 0], [0, 0, h], [d.w, 0, h], [d.w, d.d, h], [0, d.d, h]], 84, 64, 6);
            poly([P(-.2, -.2, 0), P(d.w + .2, -.2, 0), P(d.w + .2, d.d + .2, 0), P(-.2, d.d + .2, 0)], 'rgba(148,163,184,.28)'); drawItem(d, 0, 0, 0);
        }); return t[0];
    }
    function floorThumb(type, i) { var t = tc(120, 64), g = t[1]; g.save(); g.scale(22, 22); floorTex(g, 120 / 22, 64 / 22, type, i); g.restore(); return t[0]; }
    function roofThumb(r) {
        var t = tc(120, 84), g = t[1]; withCtx(g, function () {
            fitTo([[-.6, -.6, 0], [4.6, -.6, 0], [4.6, 3.6, 0], [-.6, 3.6, 0], [0, 0, WH + RH + .4]], 120, 84, 4);
            poly([P(-.5, -.5, 0), P(4.5, -.5, 0), P(4.5, 3.5, 0), P(-.5, 3.5, 0)], 'rgba(120,190,110,.5)'); box(0, 0, 0, 4, 3, WH, '#efe7d6'); drawRoofShape(r.id, ROOFCOLS[S.roofCol][1], 4, 3, 1, WH);
        }); return t[0];
    }
    function card(canvas, name, sub, on, fn, id) { var bt = mk('button', 'bd-card' + (on ? ' on' : '')); bt.type = 'button'; if (id) bt.setAttribute('data-id', id); bt.appendChild(canvas); bt.appendChild(mk('b', '', name)); if (sub) bt.appendChild(mk('small', '', sub)); bt.onclick = fn; return bt; }
    function swatches(box, list, cur, fn) { box.innerHTML = ''; list.forEach(function (c, i) { var s = mk('button', 'bd-sw' + (i === cur ? ' on' : '')); s.type = 'button'; s.style.background = c[1]; s.title = c[0]; s.setAttribute('aria-label', c[0]); s.onclick = function () { fn(i); }; box.appendChild(s); }); }
    function selectIn(box, idx) { Array.prototype.forEach.call(box.children, function (e, i) { e.classList.toggle('on', i === idx); }); }

    function buildLayouts() { var b2 = $('bdLayouts'); LAYOUTS.forEach(function (l, i) { var a = cellCount(l) * T * T; b2.appendChild(card(layoutThumb(l), l.n, l.cols + ' x ' + l.rows + ' cells · ' + a.toFixed(0) + ' m²', i === S.layout, function () { pushUndo(); S.layout = i; S.items = S.items.filter(function (it) { var d = itemDef(it.id), dm = dims(d, it.rot); for (var x = 0; x < dm[0]; x++) for (var y = 0; y < dm[1]; y++) if (!inFloor(l, it.x + x, it.y + y)) return false; return true; }); S.sel = -1; selectIn(b2, i); renderPlaced(); save(); draw(); })); }); }
    function buildBounds() { var b2 = $('bdBounds'); BOUNDS.forEach(function (bd, i) { b2.appendChild(card(boundThumb(bd), bd.n, '$' + bd.p + '/m', i === S.bound, function () { S.bound = i; selectIn(b2, i); save(); draw(); })); }); }
    function buildFurn() {
        var tabs = $('bdCats'), grid = $('bdFurn');
        function fill() { grid.innerHTML = ''; F.filter(function (d) { return d.cat === S.cat; }).forEach(function (d) { grid.appendChild(card(itemThumb(d), d.n, money(d.p), S.pick === d.id, function () { S.pick = S.pick === d.id ? null : d.id; S.pickRot = 0; S.sel = -1; S.ghost = null; markPick(); renderPlaced(); setHint(S.pick ? 'Click the floor to place the ' + d.n + '. R rotates.' : 'Pick an item, then click the floor.'); draw(); }, d.id)); }); }
        CATS.forEach(function (c) { var t = mk('button', '', c); t.type = 'button'; t.setAttribute('role', 'tab'); t.setAttribute('aria-selected', String(c === S.cat)); t.onclick = function () { S.cat = c; Array.prototype.forEach.call(tabs.children, function (x) { x.setAttribute('aria-selected', String(x.textContent === c)); }); fill(); }; tabs.appendChild(t); });
        fill();
    }
    function buildFinishes() {
        swatches($('bdWalls'), WALLS, S.wall, function (i) { S.wall = i; S.wallHex = WALLS[i][1]; S.wallName = WALLS[i][0]; $('bdWallCustom').value = S.wallHex; selectIn($('bdWalls'), i); save(); draw(); });
        $('bdWallCustom').value = S.wallHex;
        $('bdWallCustom').oninput = function (e) { S.wall = -1; S.wallHex = e.target.value; S.wallName = 'Custom ' + e.target.value; selectIn($('bdWalls'), -1); save(); draw(); };
        var seg = $('bdFloorType'); Array.prototype.forEach.call(seg.children, function (bt) { bt.onclick = function () { S.floorType = bt.getAttribute('data-v'); S.floor = 0; fl(); save(); draw(); }; });
        function fl() {
            Array.prototype.forEach.call(seg.children, function (bt) { bt.setAttribute('aria-pressed', String(bt.getAttribute('data-v') === S.floorType)); });
            var box = $('bdFloors'); box.innerHTML = ''; var list = S.floorType === 'wood' ? WOOD : MARBLE;
            list.forEach(function (m, i) { box.appendChild(card(floorThumb(S.floorType, i), m.n, '$' + m.p + '/m²', i === S.floor, function () { S.floor = i; selectIn(box, i); save(); draw(); })); });
        }
        fl(); buildFinishes.fl = fl;
    }
    function buildExterior() {
        var rb = $('bdRoofs'); ROOFS.forEach(function (r, i) { rb.appendChild(card(roofThumb(r), r.n, '$' + r.r + '/m²', i === S.roof, function () { S.roof = i; S.showRoof = true; $('bdShowRoof').checked = true; selectIn(rb, i); save(); draw(); })); });
        swatches($('bdRoofCols'), ROOFCOLS, S.roofCol, function (i) { S.roofCol = i; selectIn($('bdRoofCols'), i); Array.prototype.forEach.call(rb.children, function (cd, k) { var nc = roofThumb(ROOFS[k]); cd.replaceChild(nc, cd.firstChild); }); save(); draw(); });
        swatches($('bdFacade'), FACADES, S.facade, function (i) { S.facade = i; selectIn($('bdFacade'), i); save(); draw(); });
        $('bdShowRoof').checked = S.showRoof; $('bdSeeThru').checked = S.seeThru; $('bdSea').checked = S.sea;
        $('bdShowRoof').onchange = function (e) { S.showRoof = e.target.checked; save(); draw(); };
        $('bdSeeThru').onchange = function (e) { S.seeThru = e.target.checked; save(); draw(); };
        $('bdSea').onchange = function (e) { S.sea = e.target.checked; save(); draw(); };
    }
    var STEPS = ['Base floor', 'Boundary', 'Furniture', 'Finishes', 'Exterior', 'Inspiration'];
    function buildSteps() {
        var ol = $('bdSteps'); STEPS.forEach(function (n, i) { var li = mk('li'), bt = mk('button', '', String(i + 1)); bt.type = 'button'; bt.title = n; bt.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + n); bt.onclick = function () { setStep(i); }; li.appendChild(bt); li.style.flex = '1'; ol.appendChild(li); });
        $('bdBack').onclick = function () { setStep(S.step - 1); }; $('bdNext').onclick = function () { if (S.step >= 5) $('bdPdf').scrollIntoView({ behavior: 'smooth', block: 'center' }); else setStep(S.step + 1); };
    }
    function setStep(n) {
        S.step = Math.max(0, Math.min(5, n));
        Array.prototype.forEach.call(document.querySelectorAll('.bd-step'), function (el) { el.hidden = +el.getAttribute('data-step') !== S.step; });
        Array.prototype.forEach.call($('bdSteps').querySelectorAll('button'), function (bt, i) { bt.className = i === S.step ? 'on' : i < S.step ? 'done' : ''; });
        $('bdBack').disabled = S.step === 0; $('bdBack').style.visibility = S.step === 0 ? 'hidden' : 'visible'; $('bdNext').textContent = S.step === 5 ? 'Go to downloads' : 'Next step';
        if (S.step !== 2) { S.pick = null; S.ghost = null; markPick(); }
        setHint(['Choose a floor layout. Your furniture stays where it fits.', 'Choose how your plot is bordered.', 'Pick an item, then click the floor to place it.', 'Choose wall paint and flooring.', 'Choose a roof, colours and the sea view.', 'Upload an inspiration image.'][S.step]);
        draw();
    }

    /* ------------------------------------------------------------------ inspiration upload */
    function loadInsp(file) {
        if (!file || file.type.indexOf('image/') !== 0) { setHint('Please choose an image file.'); return; }
        if (file.size > 14 * 1024 * 1024) { setHint('That image is over 14 MB. Please pick a smaller one.'); return; }
        var r = new FileReader();
        r.onload = function () {
            var im = new Image();
            im.onload = function () {
                var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
                var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
                insp = c; inspJpeg = c.toDataURL('image/jpeg', .85); $('bdInspImg').src = inspJpeg; $('bdInsp').hidden = false; $('bdRemoveInsp').hidden = false; setHint('Inspiration image added beside your model.');
            };
            im.onerror = function () { setHint('That image could not be read.'); }; im.src = r.result;
        };
        r.readAsDataURL(file);
    }
    function wireUpload() {
        var f = $('bdFile'), dz = $('bdDrop');
        f.onchange = function (e) { loadInsp(e.target.files[0]); f.value = ''; };
        ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
        ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
        dz.addEventListener('drop', function (e) { loadInsp(e.dataTransfer.files[0]); });
        $('bdRemoveInsp').onclick = function () { insp = null; inspJpeg = null; $('bdInsp').hidden = true; $('bdInspImg').removeAttribute('src'); $('bdRemoveInsp').hidden = true; };
    }

    /* ------------------------------------------------------------------ export: PNG / JPG / PDF */
    function renderTo(W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; renderScene(c.getContext('2d'), W, H, false); return c; }
    function composeExport() {
        var W = 1800, H = 1150, foot = 100, pw = insp ? Math.round(H * .62) : 0, out = document.createElement('canvas'), g;
        out.width = W + pw; out.height = H + foot; g = out.getContext('2d');
        g.fillStyle = '#0f172a'; g.fillRect(0, 0, out.width, out.height); g.drawImage(renderTo(W, H), 0, 0);
        if (insp) {
            var k = Math.max(pw / insp.width, H / insp.height), dw = insp.width * k, dh = insp.height * k;
            g.save(); g.beginPath(); g.rect(W, 0, pw, H); g.clip(); g.drawImage(insp, W + (pw - dw) / 2, (H - dh) / 2, dw, dh); g.restore();
            g.fillStyle = 'rgba(15,23,42,.72)'; g.fillRect(W + 18, H - 62, 250, 40); g.fillStyle = '#fff'; g.font = '700 22px sans-serif'; g.fillText('Your inspiration', W + 34, H - 35);
        }
        var l = L(), fl = S.floorType === 'wood' ? WOOD[S.floor] : MARBLE[S.floor];
        g.fillStyle = '#34d399'; g.font = '800 30px sans-serif'; g.fillText('AI House Design', 36, H + 44);
        g.fillStyle = '#cbd5e1'; g.font = '500 22px sans-serif'; g.fillText(l.n + ' · ' + BOUNDS[S.bound].n + ' · ' + fl.n + ' floor · ' + (S.showRoof ? ROOFS[S.roof].n + ' roof · ' : '') + (S.sea ? 'Sea-view balcony · ' : '') + S.items.length + ' furniture items', 36, H + 80);
        var tot = 'Estimate ' + money(costs().total); g.fillStyle = '#fff'; g.font = '800 30px sans-serif'; g.fillText(tot, out.width - g.measureText(tot).width - 36, H + 58);
        return out;
    }
    function download(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
    function exportImage(type) { var c = composeExport(); c.toBlob(function (bl) { if (bl) download(bl, 'ai-house-design-3d.' + (type === 'png' ? 'png' : 'jpg')); }, type === 'png' ? 'image/png' : 'image/jpeg', .92); }
    function designPayload() {
        var l = L(), c = costs(), fl = S.floorType === 'wood' ? WOOD[S.floor] : MARBLE[S.floor], counts = {};
        S.items.forEach(function (it) { counts[it.id] = (counts[it.id] || 0) + 1; });
        return {
            layout: { name: l.n, size: l.cols + ' x ' + l.rows + ' cells', areaM2: c.areaM2 }, boundary: { name: BOUNDS[S.bound].n }, sea: S.sea,
            finishes: { wall: { name: S.wallName, hex: S.wallHex }, floor: { type: S.floorType, name: fl.n, hex: fl.c } },
            roof: { style: S.showRoof ? ROOFS[S.roof].n : 'No roof shown', colorName: ROOFCOLS[S.roofCol][0], hex: ROOFCOLS[S.roofCol][1] }, exterior: { name: FACADES[S.facade][0], hex: FACADES[S.facade][1] },
            furniture: Object.keys(counts).map(function (id) { var d = itemDef(id); return { name: d.n, cat: d.cat, qty: counts[id], price: d.p }; }),
            costs: { base: c.base, boundary: c.boundary, furniture: c.furniture, walls: c.walls, floor: c.floor, roof: c.roof, balcony: c.balcony, total: c.total }
        };
    }
    var modal = $('bdModal'), lastFocus = null;
    function openModal() { lastFocus = document.activeElement; modal.hidden = false; $('bdError').hidden = true; var f = $('bdCheckin').elements.name; setTimeout(function () { f.focus(); }, 30); }
    function closeModal() { modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    function tokenGet() { try { return sessionStorage.getItem('hd-bd-token'); } catch (e) { return null; } }
    function tokenSet(t) { try { sessionStorage.setItem('hd-bd-token', t); } catch (e) { } }
    function tokenClear() { try { sessionStorage.removeItem('hd-bd-token'); } catch (e) { } }
    function sendPdf(token) {
        var btn = $('bdPdf'), label = btn.innerHTML; btn.disabled = true; btn.textContent = 'Building your PDF…';
        var body = { token: token, design: designPayload(), render: renderTo(1500, 950).toDataURL('image/jpeg', .9), inspiration: inspJpeg || '' };
        return fetch('/api/builder/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
            if (r.status === 401) { tokenClear(); openModal(); throw new Error('checkin'); }
            if (!r.ok) throw new Error('fail');
            return r.blob();
        }).then(function (bl) { download(bl, 'ai-house-design-blueprint.pdf'); setHint('Your PDF blueprint has been downloaded.'); })
            .catch(function (e) { if (e.message !== 'checkin') setHint('Sorry, the PDF could not be created. Please try again.'); })
            .then(function () { btn.disabled = false; btn.innerHTML = label; });
    }
    function wireExport() {
        $('bdPng').onclick = function () { exportImage('png'); }; $('bdJpg').onclick = function () { exportImage('jpg'); };
        $('bdPdf').onclick = function () { var t = tokenGet(); if (t) sendPdf(t); else openModal(); };
        $('bdModalX').onclick = closeModal; modal.addEventListener('mousedown', function (e) { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', function (e) { if (!modal.hidden && e.key === 'Escape') closeModal(); });
        $('bdCheckin').addEventListener('submit', function (e) {
            e.preventDefault(); var f = e.target, err = $('bdError'), sub = $('bdSubmit'); err.hidden = true;
            Array.prototype.forEach.call(f.elements, function (el) { if (el.classList) el.classList.remove('bad'); });
            var data = { name: f.elements.name.value, email: f.elements.email.value, phone: f.elements.phone.value, city: f.elements.city.value, consent: f.elements.consent.checked };
            sub.disabled = true;
            fetch('/api/builder/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (res) {
                if (!res.ok || !res.j.ok) { err.textContent = res.j.error || 'Please check your details.'; err.hidden = false; if (res.j.field && f.elements[res.j.field] && f.elements[res.j.field].classList) f.elements[res.j.field].classList.add('bad'); sub.disabled = false; return; }
                tokenSet(res.j.token); sub.disabled = false; closeModal(); sendPdf(res.j.token);
            }).catch(function () { err.textContent = 'Network problem. Please try again.'; err.hidden = false; sub.disabled = false; });
        });
    }

    /* ------------------------------------------------------------------ persistence + init */
    function save() { try { localStorage.setItem('hd-builder-v1', JSON.stringify({ layout: S.layout, bound: S.bound, items: S.items, wall: S.wall, wallHex: S.wallHex, wallName: S.wallName, floorType: S.floorType, floor: S.floor, roof: S.roof, roofCol: S.roofCol, facade: S.facade, showRoof: S.showRoof, seeThru: S.seeThru, sea: S.sea })); } catch (e) { } }
    function restore() {
        try {
            var d = JSON.parse(localStorage.getItem('hd-builder-v1') || 'null'); if (!d) return;
            if (LAYOUTS[d.layout]) S.layout = d.layout; if (BOUNDS[d.bound]) S.bound = d.bound; if (ROOFS[d.roof]) S.roof = d.roof; if (ROOFCOLS[d.roofCol]) S.roofCol = d.roofCol; if (FACADES[d.facade]) S.facade = d.facade;
            S.floorType = d.floorType === 'wood' ? 'wood' : 'marble'; var fl = S.floorType === 'wood' ? WOOD : MARBLE; S.floor = fl[d.floor] ? d.floor : 0;
            if (/^#[0-9a-f]{6}$/i.test(d.wallHex)) { S.wallHex = d.wallHex; S.wall = typeof d.wall === 'number' ? d.wall : -1; S.wallName = String(d.wallName || 'Custom').slice(0, 40); }
            S.showRoof = !!d.showRoof; S.seeThru = d.seeThru !== false; S.sea = !!d.sea;
            var l = L(); S.items = (d.items || []).filter(function (it) { var df = itemDef(it.id); if (!df) return false; var dm = dims(df, it.rot ? 1 : 0); for (var x = 0; x < dm[0]; x++) for (var y = 0; y < dm[1]; y++) if (!inFloor(l, it.x + x, it.y + y)) return false; return true; }).slice(0, 80).map(function (it) { return { id: it.id, x: it.x | 0, y: it.y | 0, rot: it.rot ? 1 : 0 }; });
        } catch (e) { }
    }
    function reset() { if (!window.confirm('Reset the whole design and start again?')) return; try { localStorage.removeItem('hd-builder-v1'); } catch (e) { } location.reload(); }

    restore();
    buildSteps(); buildLayouts(); buildBounds(); buildFurn(); buildFinishes(); buildExterior(); wireUpload(); wireExport(); renderPlaced();
    $('bdRotate').onclick = rotate; $('bdDelete').onclick = removeSel; $('bdUndo').onclick = undo; $('bdReset').onclick = reset;
    $('bdClear').onclick = function () { if (!S.items.length) return; pushUndo(); S.items = []; S.sel = -1; renderPlaced(); save(); draw(); };
    new MutationObserver(function () { draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    setStep(0);
})();