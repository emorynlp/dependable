/**
 * Copyright 2014, Emory University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
<!--

const FONT_NAME = "bold 13px arial";
const INIT_Y     = 40;
const GAP_NAME   = 45;
const GAP_TREE   = 80;
const TEXT_WIDTH = 35;

const ID_GOLD_FILE      = 'GOLD_FILE';
const ID_SYSTEM_FILES   = 'SYSTEM_FILES';
const ID_PROCESS_BUTTON = 'PROCESS_BUTTON';
const ID_EXPORT_BUTTON  = 'EXPORT_BUTTON';
const ID_TREE_IDS       = 'TREE_IDS';
const ID_CANVAS_TREES   = 'CANVAS_TREES';
const ID_ZOOM           = 'ZOOM';
const ID_TREE_NUMBER    = 'TREE_NUMBER';

const ID_CONTROL_PANEL_TOP = 'CONTROL_PANEL_TOP';
const ID_CONTROL_PANEL     = 'CONTROL_PANEL';

const ID_RADIO_SKIP = 'RADIO_SKIP';
const ID_SKIP_LAS   = 'SKIP_LAS';
const ID_SKIP_UAS   = 'SKIP_UAS';
const ID_SKIP_NONE  = 'SKIP_NONE';

const ID_LAS_MIN = 'LAS_MIN';
const ID_LAS_MAX = 'LAS_MAX';
const ID_UAS_MIN = 'UAS_MIN';
const ID_UAS_MAX = 'UAS_MAX';

const ID_SEN_LEN_MIN = 'SEN_LEN_MIN';
const ID_SEN_LEN_MAX = 'SEN_LEN_MAX';

const ID_TEXT_FORM    = 'TEXT_FORM';
const ID_TEXT_POS     = 'TEXT_POS';
const ID_TEXT_HEAD_ID = 'TEXT_HEAD_ID';
const ID_TEXT_DEPREL  = 'TEXT_DEPREL';

// -------------------------------------- Interface --------------------------------------

g_trees = [];
s_trees = [];
s_names = [];

function exportCanvas()
{
    var ctx = document.getElementById(ID_CANVAS_TREES);
    var img = ctx.toDataURL("image/png");
    window.open(img);
}

function readGoldFile(file)
{
    readDEPTreesFromFile(file, true);
}

function readSystemFiles(files)
{
    // clear previous system information
    while (s_trees.length > 0) s_trees.pop();

    // add new text-fields given system filenames
    var i, size = files.length;

    for (i=0; i<size; i++)
        readDEPTreesFromFile(files[i], false, size);
}

function readDEPTreesFromFile(file, isGold, len)
{
    IDX_FORM    = document.getElementById(ID_TEXT_FORM).value;
    IDX_POS     = document.getElementById(ID_TEXT_POS).value;
    IDX_HEAD_ID = document.getElementById(ID_TEXT_HEAD_ID).value;
    IDX_DEPREL  = document.getElementById(ID_TEXT_DEPREL).value;

    var ctx = document.getElementById(ID_CANVAS_TREES).getContext('2d');
    var reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function(e)
    {
        trees = getDEPTreesFromText(e.target.result, isGold);
        initDEPTrees(trees, ctx, isGold);

        if (isGold)
        {
            g_trees = trees;
            document.getElementById(ID_SYSTEM_FILES).disabled = false;
        }
        else
        {
            s_trees.push(trees);
            s_names.push(file.name);

            if (s_trees.length == len)
            {
                document.getElementById(ID_PROCESS_BUTTON).disabled = false;
                document.getElementById(ID_EXPORT_BUTTON).disabled = false;
                resetControlPanel();
            }
        }
    };
}

function initDEPTrees(trees, ctx, isGold)
{
    for (var i=0; i<trees.length; i++)
    {
        if (!isGold) trees[i].setScores(g_trees[i]);
        trees[i].initGeometries(ctx);
    }
}

function resetControlPanel()
{
    document.getElementById(ID_SKIP_NONE).checked = true;

    var td = document.getElementById(ID_CONTROL_PANEL);
    while (td.firstChild) td.removeChild(td.firstChild);

    _resetMinMax(td);
}

function _resetMinMax(td)
{
    var i, size = s_names.length;
    var table, ttr, ttd;

    for (i=0; i<size; i++)
    {
        table = document.createElement('table');
        ttr = document.createElement('tr');

        ttd = document.createElement('td'); ttr.appendChild(ttd);
        ttd.appendChild(createTextField(ID_LAS_MIN+i.toString(), 0, TEXT_WIDTH));

        ttd = document.createElement('td'); ttr.appendChild(ttd);
        ttd.appendChild(createText('LAS'));

        ttd = document.createElement('td'); ttr.appendChild(ttd);
        ttd.appendChild(createTextField(ID_LAS_MAX+i.toString(), 100, TEXT_WIDTH));
        table.appendChild(ttr);

        ttr = document.createElement('tr');

        ttd = document.createElement('td'); ttr.appendChild(ttd);
        ttd.appendChild(createTextField(ID_UAS_MIN+i.toString(), 0, TEXT_WIDTH));

        ttd = document.createElement('td'); ttr.appendChild(ttd);
        ttd.appendChild(createText('UAS'));

        ttd = document.createElement('td'); ttr.appendChild(ttd);
        ttd.appendChild(createTextField(ID_UAS_MAX+i.toString(), 100, TEXT_WIDTH));
        table.appendChild(ttr);

        td.appendChild(createBR());
        td.appendChild(createText(s_names[i]));
        td.appendChild(createBR());
        td.appendChild(table);
    }
}

// --------------------------------------- Select ----------------------------------------

function process()
{
    document.getElementById(ID_GOLD_FILE).disabled = true;
    document.getElementById(ID_SYSTEM_FILES).disabled = true;

    var skipLAS = document.getElementById(ID_SKIP_LAS).checked;
    var skipUAS = document.getElementById(ID_SKIP_UAS).checked;
    var minLAS  = getBounds(ID_LAS_MIN);
    var minUAS  = getBounds(ID_UAS_MIN);
    var maxLAS  = getBounds(ID_LAS_MAX);
    var maxUAS  = getBounds(ID_UAS_MAX);
    var minSen  = document.getElementById(ID_SEN_LEN_MIN).value;
    var maxSen  = document.getElementById(ID_SEN_LEN_MAX).value;
    var ids = document.getElementById(ID_TREE_IDS), opt;
    var i, size = g_trees.length;
    ids.options.length = 0;

    for (i=0; i<size; i++)
    {
        if (isSkip(i, skipLAS, skipUAS) || !isAccept(i, minSen, maxSen, minLAS, minUAS, maxLAS, maxUAS)) continue;
        opt = document.createElement('option');
        opt.value = i;
        opt.text  = i;
        ids.appendChild(opt);
    }

    var td = document.getElementById(ID_TREE_NUMBER);
    while (td.firstChild) td.removeChild(td.firstChild);
    td.appendChild(createText(numberWithCommas(ids.options.length)+' trees'));

    if (ids.length > 0)
    {
        ids.selectedIndex = 0;
        selectTreeID();
        document.addEventListener('keydown', keyDownHandler, false);
    }
    else
    {
        var ctx  = document.getElementById(ID_CANVAS_TREES).getContext('2d');
        var zoom = document.getElementById(ID_ZOOM).value;

        ctx.beginPath();
        ctx.scale(zoom, zoom);
        ctx.fillStyle = COLOR_WHITE;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.closePath();
    }
}

function getBounds(id)
{
    var i, size = s_names.length;
    var bounds = [];

    for (i=0; i<size; i++)
        bounds.push(document.getElementById(id+i.toString()).value);

    return bounds;
}

function isSkip(index, skipLAS, skipUAS)
{
    if (!skipLAS && !skipUAS) return false;
    var gTree = g_trees[index], tree;
    var i, size = s_trees.length, len = gTree.size() - 1;

    for (i=0; i<size; i++)
    {
        tree = s_trees[i][index];

        if (skipLAS && tree.las != 100) return false;
        if (skipUAS && tree.uas != 100) return false;
    }

    return true;
}

function isAccept(index, minSen, maxSen, minLAS, minUAS, maxLAS, maxUAS)
{
    var gTree = g_trees[index], tree;
    var i, size = s_trees.length, len = gTree.size() - 1;

    if (len > maxSen || len < minSen) return false;

    for (i=0; i<size; i++)
    {
        tree = s_trees[i][index];

        if (minLAS[i] > tree.las) return false;
        if (maxLAS[i] < tree.las) return false;
        if (minUAS[i] > tree.uas) return false;
        if (maxUAS[i] < tree.uas) return false;
    }

    return true;
}

function keyDownHandler(event)
{
         if (event.keyCode == 33) clickPrevious();     // page up
    else if (event.keyCode == 34) clickNext();         // page down
}

function selectTreeID()
{
    var ids = document.getElementById(ID_TREE_IDS);
    drawDEPTrees(document.getElementsByTagName('option')[ids.selectedIndex].value);
}

function clickPrevious()
{
    var ids = document.getElementById(ID_TREE_IDS);

    if (ids.options.length > 0 && ids.selectedIndex > 0)
    {
    	ids.selectedIndex--;
        selectTreeID();
    }
}

function clickNext()
{
    var ids = document.getElementById(ID_TREE_IDS);

    if (ids.options.length > 0 && ids.selectedIndex+1 < ids.length)
    {
    	ids.selectedIndex++;
        selectTreeID();
    }
}

// -------------------------------- Draw dependency tree ---------------------------------

function drawDEPTrees(index)
{
    var ctx  = document.getElementById(ID_CANVAS_TREES).getContext('2d');
    var zoom = document.getElementById(ID_ZOOM).value;

    setCanvas(ctx, zoom, index);

    ctx.beginPath();
    ctx.scale(zoom, zoom);
	ctx.fillStyle = COLOR_WHITE;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.closePath();

    var y, i, size = s_names.length;
    y = drawTree(g_trees[index], 'Gold', ctx, INIT_Y);

    for (i=0; i<size; i++)
        y = drawTree(s_trees[i][index], s_names[i], ctx, y+GAP_TREE);

    window.scrollTo(0, 0);
}

// Initializes all geometries needed to draw this tree to the specific canvas.
function setCanvas(ctx, zoom, index)
{
    var tree = g_trees[index];
    var maxW = tree.r_lexica[tree.size()-1].getMaxX();
    var maxH = tree.maxHeight + FORM_GAP_H + GAP_TREE;

    for (var i=0; i<s_trees.length; i++)
    {
        tree = s_trees[i][index];
        maxW = Math.max(maxW, tree.r_lexica[tree.size()-1].getMaxX());
        maxH += tree.maxHeight + FORM_GAP_H + GAP_TREE;
    }

    ctx.canvas.width = maxW + (INIT_X*2);
    ctx.canvas.width *= zoom;
    if (ctx.canvas.width < 450)
        ctx.canvas.width = 450;

    ctx.canvas.height = maxH + INIT_Y;
    ctx.canvas.height *= zoom;
}

// Draws the specific dependency tree to the canvas context.
function drawTree(tree, name, ctx, initY)
{
    var y = tree.maxHeight + FORM_GAP_H + initY;

    _drawName (tree, name, ctx, y+GAP_NAME);
    _drawLexca(tree, ctx, y);
    _drawArcs (tree, ctx, y-FORM_GAP_H);

    return y;
}

// -------------------------------------- Draw tree --------------------------------------

function _drawName(tree, name, ctx, y)
{
    var text = name;
    if (!isUndefined(tree.uas))
        text += ': LAS = '+tree.las.toFixed(2)+', UAS = '+tree.uas.toFixed(2);

    ctx.beginPath();
    ctx.font = FONT_NAME;
    ctx.fillStyle = COLOR_ORANGE;
    ctx.fillText(text, INIT_X, y);
    ctx.closePath();
}

// Called by drawTree(...).
function _drawLexca(tree, ctx, y)
{
    var i, j, len, size = tree.size();
    var node;
    var rect;
    var args;

    ctx.beginPath();
    ctx.font = FONT_ID;
    ctx.fillStyle = COLOR_BLACK;

    for (i=0; i<size; i++)
    {
        node = tree.getNode(i);
        rect = tree.r_lexica[i];
        ctx.fillText(node.id, rect.getIdX()+ID_GAP_W, y+ID_GAP_H);
    }

    ctx.closePath();

    ctx.beginPath();
    ctx.font = FONT_FORM;
    ctx.fillStyle = COLOR_BLACK;

    for (i=0; i<size; i++)
    {
        node = tree.getNode(i);
        rect = tree.r_lexica[i];
        ctx.fillText(node.form, rect.getFormX(), y);
    }

    ctx.closePath();

    ctx.beginPath();
    ctx.font = FONT_POS;
    ctx.fillStyle = COLOR_GREEN;
    y += 20;

    for (i=0; i<size; i++)
    {
        node = tree.getNode(i);
        rect = tree.r_lexica[i];
        ctx.fillText(node.pos, rect.getPOSX(), y);
    }

    ctx.closePath();
}

// Called by drawTree().
function _drawArcs(tree, ctx, y)
{
    var i, yh, size = tree.size();
    var node;
    var rEdge, rLex;

    for (i=1; i<size; i++)
    {
        rEdge = tree.r_edges[i];
        rLex  = tree.r_lexica[i];
        node  = tree.getNode(i);
        yh    = y - rEdge.height;

        _drawEdges (ctx, rEdge.xh, rEdge.xd, y, yh, node);
        _drawDeprel(ctx, rEdge.xh, rEdge.xd, rLex.w_deprel, yh, node);
    }
}

// Called by _drawArcs().
function _drawEdges(ctx, x1, x2, y, yh, node)
{
    // arc
    ctx.beginPath();
    ctx.fillStyle = (isUndefined(node.uas) || node.uas) ? COLOR_BLACK : COLOR_RED;

    var xl, xr;

    if (x1 < x2) {xl = x1; xr = x2;}
    else         {xl = x2; xr = x1;}

    ctx.moveTo(xl, y-1);
    ctx.lineTo(xl, yh+ARC_RADIUS);
    ctx.arc(xl+ARC_RADIUS, yh+ARC_RADIUS, ARC_RADIUS, Math.PI, 1.5*Math.PI, false);
    ctx.lineTo(xr-ARC_RADIUS, yh);
    ctx.arc(xr-ARC_RADIUS, yh+ARC_RADIUS, ARC_RADIUS, 1.5*Math.PI, 0, false);
    ctx.lineTo(xr, y-1);
    ctx.stroke();

    ctx.closePath();

    // anchor
    ctx.beginPath();

    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - ANCHOR_W, y - ANCHOR_H);
    ctx.lineTo(x2 + ANCHOR_W, y - ANCHOR_H);
    ctx.fill();

    ctx.closePath();
}

// Called by _drawArcs().
function _drawDeprel(ctx, x1, x2, w, yh, node)
{
    ctx.beginPath();
    ctx.font = FONT_DEPREL;

    var x = x2 - 0.5 * (x2 - x1 + w);
    var y = yh + DEPREL_SHIFT_H;

    ctx.fillStyle = COLOR_WHITE;
    ctx.fillRect(x-DEPREL_SHIFT_W, yh-DEPREL_SHIFT_H, w+2*DEPREL_SHIFT_W, 2*DEPREL_SHIFT_H);

    // label foreground
    ctx.fillStyle = (isUndefined(node.ls) || node.ls) ? COLOR_BLUE : COLOR_RED;
    ctx.fillText(node.deprel, x, y);

    ctx.closePath();
}

-->