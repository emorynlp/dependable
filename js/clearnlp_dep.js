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
const FONT_ID     = "10px arial";
const FONT_FORM   = "13px arial";
const FONT_POS    = "12px arial";
const FONT_DEPREL = "12px arial";

const ANCHOR_W = 4;
const ANCHOR_H = 8;

const ARC_RADIUS = 5;
const ARC_GAP_H  = 20;
const ARC_GAP_W  = ARC_RADIUS * 2;

const ID_GAP_W = 1;
const ID_GAP_H = 2;

const FORM_GAP_W  = 25;
const FORM_GAP_H  = 12;

const DEPREL_MARGIN_W = 40;
const DEPREL_SHIFT_W  = 4;
const DEPREL_SHIFT_H  = 4;

const INIT_X = 25;

const DELIM_FIELD = '\t';
const DELIM_NODE  = '\n';
const DELIM_FEAT  = '|';
const BLANK_LINE  = '_';

IDX_FORM    = 1;
IDX_POS     = 4;
IDX_HEAD_ID = 6;
IDX_DEPREL  = 7;

// --------------------------------- Geometry Components ---------------------------------

function RLexicon(ctx, node)
{
    var deprel, max = 0;

    this.w_form   = getFontWidth(ctx, FONT_FORM  , node.form);
    this.w_pos    = getFontWidth(ctx, FONT_POS   , node.pos);
    this.w_deprel = getFontWidth(ctx, FONT_DEPREL, node.deprel);
    this.w_max    = Math.max(this.w_form, this.w_pos);
}

RLexicon.prototype.setMinX = function(x)
{
    this.x_min = x;
}

RLexicon.prototype.addMinX = function(x)
{
    this.x_min += x;
}

RLexicon.prototype.getMinX = function()
{
    return this.x_min;
}

RLexicon.prototype.getMaxX = function()
{
    return this.x_min + this.w_max;
}

RLexicon.prototype.getCenterX = function()
{
    return this.x_min + 0.5 * this.w_max;
}

RLexicon.prototype.getIdX = function()
{
    return this.getFormX() + this.w_form;
}

RLexicon.prototype.getFormX = function()
{
    return this._getX(this.w_form);
}

RLexicon.prototype.getPOSX = function()
{
    return this._getX(this.w_pos);
}

RLexicon.prototype._getX = function(width)
{
    return this.x_min + 0.5 * (this.w_max - width);
}

function REdge(xd, xh, height)
{
    this.xd     = xd;
    this.xh     = xh;
    this.height = height;
}

// ----------------------------------- Dependency Node -----------------------------------

function DEPNode(fields)
{
    if (isUndefined(fields))
    {
        this.form   = 'root';
        this.pos    = 'root';
        this.headId = -1;
        this.deprel = 'none';
    }
    else
    {
        this.form   = fields[IDX_FORM];
        this.pos    = fields[IDX_POS];
        this.headId = (fields[IDX_HEAD_ID] == '_') ? 0 : parseInt(fields[IDX_HEAD_ID]);
        this.deprel = fields[IDX_DEPREL];
    }

    this.childIds = [];
}

DEPNode.prototype.addChildID = function(id)
{
    this.childIds.push(id);
}

DEPNode.prototype.getChildIDs = function()
{
    return this.childIds;
}

// ----------------------------------- Dependency Tree -----------------------------------

function DEPTree()
{
    this.nodes = [];
    this.addNode(new DEPNode());
}

DEPTree.prototype.addNode = function(node)
{
    node.id = this.size();
    this.nodes.push(node);
}

DEPTree.prototype.getNode = function(id)
{
    return this.nodes[id];
}

DEPTree.prototype.getHead = function(id)
{
    var headId = this.getNode(id).headId;
    return this.getNode(headId);
}

DEPTree.prototype.size = function()
{
    return this.nodes.length;
}

DEPTree.prototype.initChildren = function()
{
    var i, size = this.size();
    var head;

    for (i=1; i<size; i++)
    {
        head = this.getHead(i);
        if (!isUndefined(head)) head.addChildID(i);
    }
}

DEPTree.prototype.checkSymbols = function()
{
    var i, size = this.size();
    var node;

    for (i=1; i<size; i++)
    {
        node = this.getNode(i);
        node.isSymbol = isSymbol(node.form);
    }
}

DEPTree.prototype.checkNonProjective = function()
{
    var i, size = this.size();

    for (i=1; i<size; i++)
    {
        if (this.isNonProjective(i))
        {
            this.nonProjective = true;
            return;
        }
    }

    this.nonProjective = false;
}

DEPTree.prototype.isNonProjective = function(id)
{
    var head = this.getHead(id);
    if (isUndefined(head)) return false;
    var node = this.getNode(id);
    var beginId = node.id, endId = head.id, count = 0, i, headId;

    if (head.id < node.id)
    {
        beginId = head.id;
        endId   = node.id;
    }

    for (i=beginId+1; i<endId; i++)
    {
        headId = this.getNode(i).headId;

        if (headId < beginId || headId > endId)
            return true;
    }

    return false;
}

DEPTree.prototype.setScores = function(goldTree)
{
    var i, size = this.size(), uas = 0, las = 0;
    var node;

    for (i=1; i<size; i++)
    {
        gNode = goldTree.getNode(i);
        sNode = this.getNode(i);

        sNode.uas = (gNode.headId == sNode.headId);
        sNode.ls  = (gNode.deprel == sNode.deprel);

        if (sNode.uas)
        {
            uas++;
            if (sNode.ls) las++;
        }
    }

    this.las = 100.0 * las / (size-1);
    this.uas = 100.0 * uas / (size-1);
}

// ----------------------------------- Init Geometries -----------------------------------

// Initializes all geometries needed to draw this tree to the specific canvas.
DEPTree.prototype.initGeometries = function(ctx)
{
    var  groups   = this._getGeometriesGroups();
    this.r_lexica = this._getGeometriesLexica(groups, ctx);
    this.r_edges  = this._getGeometriesEdges (groups);
}

// Called by initGeometries().
DEPTree.prototype._getGeometriesGroups = function()
{
    var i, size = this.size();
    var curr, head;

    var lhs = createNestedEmptyArray(size);
    var rhs = createNestedEmptyArray(size);
    var groups = [];

    for (i=1; i<size; i++)
    {
        head = this.getHead(i);
        if (isUndefined(head)) continue;
        curr = this.getNode(i);

         if (curr.id < head.id)
         {
             lhs[head.id].push(curr.id);
             rhs[curr.id].push(head.id);
         }
         else
         {
             lhs[curr.id].push(head.id);
             rhs[head.id].push(curr.id);
         }
    }

    for (i=0; i<size; i++)
    {
        lhs[i] = lhs[i].sort(descendingOrder);
        rhs[i] = rhs[i].sort(descendingOrder);
        groups.push(lhs[i].concat(rhs[i]));
    }

    return groups;
}

// Called by initGeometries().
DEPTree.prototype._getGeometriesLexica = function(groups, ctx)
{
    var i, j, w, m, x, pm = 0, size = this.size();
    var rLexica = [], rect;
    var node, head;

    //  m: the extra margin when edge lines take more space than the form
    // pm: the previous extra margin
    for (i=0; i<size; i++)
    {
        rect = new RLexicon(ctx, this.getNode(i));

        m = (groups[i].length - 1) * ARC_GAP_W - rect.w_max;
        m = (m > 0) ? 0.5 * m : 0;
        x = (i > 0) ? rLexica[i-1].getMaxX() + FORM_GAP_W : INIT_X;

        rect.setMinX(x+m+pm);
        rLexica.push(rect);
        pm = m;
    }

    // if dependency label takes more space
    for (i=1; i<size; i++)
    {
        head = this.getHead(i);
        if (isUndefined(head)) continue;
        node = this.getNode(i);
        rect = rLexica[i];

        w = rect.w_deprel + DEPREL_MARGIN_W;
        m = Math.abs(rLexica[node.id].getMinX() - rLexica[head.id].getMinX());

        if (w > m)
        {
            j = (node.id > head.id) ? node.id : head.id;
            w -= m;
            for (; j<size; j++) rLexica[j].addMinX(w);
        }
    }

    // centering
/*  w = rLexica[size-1].getMaxX() - rLexica[0].getMinX();
    x = 0.5 * (ctx.canvas.width - w);
    m = x - rLexica[0].getMinX();
    alert(ctx.canvas.width);

    if (m > 0)
    {
        for (i=0; i<size; i++)
            rLexica[i].addMinX(m);
    }*/

    return rLexica;
}

// Called by initGeometries().
DEPTree.prototype._getGeometriesEdges = function(groups)
{
    var i, h, xh, xd, max = 0, size = this.size();
    var heights = this._getHeights();
    var rEdges = [null];
    var curr, head;

    for (i=1; i<size; i++)
    {
        head = this.getHead(i);
        if (isUndefined(head)) continue;
        curr = this.getNode(i);
        xd   = this._getGeometriesEdgesAux(groups, this.r_lexica, curr.id, head.id);
        xh   = this._getGeometriesEdgesAux(groups, this.r_lexica, head.id, curr.id);
        h    = heights[i] * ARC_GAP_H;
        max  = Math.max(h, max);
        rEdges.push(new REdge(xd, xh, h));
    }

    this.maxHeight = max;
    return rEdges;
}

// Called by _getGeometriesEdges().
DEPTree.prototype._getGeometriesEdgesAux = function(groups, rLexica, id1, id2)
{
    return rLexica[id1].getCenterX() - (0.5 * (groups[id1].length - 1) - groups[id1].indexOf(id2)) * ARC_GAP_W;
}

// Called by _getGeometriesEdges().
DEPTree.prototype._getHeights = function()
{
    var i, size = this.size();
    var heights = [];

    for (i=0; i<size; i++)
        heights.push(0);

    for (i=1; i<size; i++)
        this._getHeightsProj(heights, i);

    for (i=1; i<size; i++)
        this._getHeightsNonProj(heights, i);

    return heights;
}

// Called by _getHeights().
DEPTree.prototype._getHeightsProj = function(heights, id)
{
    var curr = this.getNode(id);
    var head = this.getHead(id);
    var i, st, et, max = 0;
    var node;

    if (isUndefined(head))
        return;

    if (curr.id < head.id)
    {
        st = curr.id;
        et = head.id;
    }
    else
    {
        st = head.id;
        et = curr.id;
    }

    for (i=st; i<=et; i++)
    {
        if (i == id) continue;
        node = this.getHead(i);

        if (!isUndefined(node) && st <= node.id && node.id <= et)
        {
            if (heights[i] == 0) this._getHeightsProj(heights, i);
            max = Math.max(max, heights[i]);
        }
    }

    heights[id] = max + 1;
}

// Called by _getHeights().
DEPTree.prototype._getHeightsNonProj = function(heights, id)
{
    var i, j, st, et, headId, childId, childIds;
    var curr = this.getNode(id);
    var head = this.getHead(id);
    var height = heights[id];
    var node;

    if (isUndefined(head))
        return;

    if (curr.id < head.id)
    {
        st = curr.id;
        et = head.id;
    }
    else
    {
        st = head.id;
        et = curr.id;
    }

    for (i=st+1; i<et; i++)
    {
        node   = this.getNode(i);
        headId = node.headId;

        if ((headId < st || headId > et) && heights[i] == height)
        {
            heights[id] += 1;
            break;
        }

        childIds = node.getChildIDs();

        for (j=childIds.length-1; j>=0; j--)
        {
            childId = childIds[j];

            if ((childId < st || childId > et) && heights[childId] == height)
            {
                heights[id] += 1;
                return;
            }
        }
    }
}

-->