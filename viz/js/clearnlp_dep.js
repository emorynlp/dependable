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
const DELIM_FIELD = "\t";
const DELIM_NODE  = "\n";
const DELIM_FEAT  = "|";
const BLANK       = "_";

// ----------------------------------- Dependency Node -----------------------------------

function DEPNode(fields)
{
    this.id     = parseInt(fields[0]);
    this.form   = fields[1];
    this.lemma  = fields[2];
    this.pos    = fields[4];
//  this.initFeats(fields[5]);
    this.headId = parseInt(fields[6]);
    this.deprel = fields[7];
    this.childIds = [];
}

DEPNode.prototype.addChildID = function(id)
{
    this.childIds.push(id);
};

DEPNode.prototype.getChildIDs = function()
{
    return this.childIds;
};

// ----------------------------------- Dependency Tree -----------------------------------

function DEPTree()
{
    var root = new DEPNode(['0', 'root', 'root', 'root', 'root', '_', '-1', 'none']);
    this.nodes = [root];
}

DEPTree.prototype.addNode = function(node)
{
    this.nodes.push(node);
};

DEPTree.prototype.getNode = function(id)
{
    return this.nodes[id];
};

DEPTree.prototype.getHead = function(id)
{
    var headId = this.getNode(id).headId;
    return this.getNode(headId);
};

DEPTree.prototype.size = function()
{
    return this.nodes.length;
};

DEPTree.prototype.initChildren = function()
{
    var i, size = this.size();
    var head;

    for (i=1; i<size; i++)
    {
        head = this.getHead(i);
        if (typeof(head) == 'undefined') alert('Illegal format')
        else head.addChildID(i);
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
};

// -------------------------------- Get Dependency Trees ---------------------------------

function getDEPTreesFromText(text, checkSymbols)
{
    var lines = text.split(DELIM_NODE), fields;
    var tree  = new DEPTree();
    var trees = [];

    for (var i=0; i<lines.length; i++)
    {
        fields = lines[i].trim().split(DELIM_FIELD);

        if (fields.length < 8)
        {
        	addDEPTree(trees, tree, checkSymbols);
			tree = new DEPTree();
        }
        else
            tree.addNode(new DEPNode(fields));
    }

    addDEPTree(trees, tree, checkSymbols);
    return trees;
}

function addDEPTree(trees, tree, checkSymbols)
{
	if (tree.size() > 1)
	{
		tree.initChildren();
		if (checkSymbols) tree.checkSymbols();
		trees.push(tree);
	}
}



-->