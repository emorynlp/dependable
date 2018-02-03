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
const LABELS_ACC  = ['LAS','UAS','LS'];
const LABELS_SEN  = ['<=10','<=20','<=30','<=40','<=50','>50'];
const LABELS_DEP  = ['<-5','-5','-4','-3','-2','-1','1','2','3','4','5','>5'];

const SEN_NUM = LABELS_SEN.length;
const DEP_NUM = LABELS_DEP.length;

const TD_WIDTH = 80;

const ID_CHART_SPACE    = 'CHART_SPACE';
const ID_GOLD_FILE      = 'GOLD_FILE';
const ID_SYSTEM_FILES   = 'SYSTEM_FILES';
const ID_PROCESS_BUTTON = 'PROCESS_BUTTON';

const ID_INCLUDE_SYMBOLS = 'INCLUDE_SYMBOLS';
const ID_INCLUDE_PROJ    = 'INCLUDE_PROJ';
const ID_INCLUDE_NONPROJ = 'INCLUDE_NONPROJ';

const ID_TEXT_FORM    = 'TEXT_FORM';
const ID_TEXT_POS     = 'TEXT_POS';
const ID_TEXT_HEAD_ID = 'TEXT_HEAD_ID';
const ID_TEXT_DEPREL  = 'TEXT_DEPREL';

// -------------------------------------- Interface --------------------------------------

var g_trees;
var s_files  = [];
var s_scores = [];
var s_trees  = [];
var s_pos = {};
var n_pos = 0;
var s_deprel = {};
var n_deprel = 0;
var mcnemar_las = [];
var mcnemar_uas = [];
var ensemble_mac_las = [];
var ensemble_mac_uas = [];
var ensemble_mac_ls  = [];
var ensemble_mic_las = [];
var ensemble_mic_uas = [];
var ensemble_mic_ls  = [];

var include_symbols = true;
var include_proj    = true;
var include_nonproj = true;

function readGoldFile(file)
{
    readDEPTreesFromFile(file, true);
}

function readSystemFiles(files)
{
    s_files = files;
    document.getElementById(ID_PROCESS_BUTTON).disabled = false;
}

function readDEPTreesFromFile(file, isGold, len)
{
    IDX_FORM    = document.getElementById(ID_TEXT_FORM).value;
    IDX_POS     = document.getElementById(ID_TEXT_POS).value;
    IDX_HEAD_ID = document.getElementById(ID_TEXT_HEAD_ID).value;
    IDX_DEPREL  = document.getElementById(ID_TEXT_DEPREL).value;

    include_symbols = document.getElementById(ID_INCLUDE_SYMBOLS).checked;
    include_proj    = document.getElementById(ID_INCLUDE_PROJ).checked;
    include_nonproj = document.getElementById(ID_INCLUDE_NONPROJ).checked;

    var reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function(e)
    {
        trees = getDEPTreesFromText(e.target.result, isGold);

        if (isGold)
        {
            g_trees = trees;
            initSets(trees);
            document.getElementById(ID_SYSTEM_FILES).disabled = false;
        }
        else
        {
            var scores = new Score(file.name, true);
            addScores(g_trees, trees, scores);
            scores.finalize();
            s_scores.push(scores);
            s_trees.push(trees);

            if (s_scores.length == len)
            {
                measureMcNemar();
                while (s_trees.length > 0) s_trees.pop();
                processAux();
            }
        }
    };
}

function initSets(trees)
{
    var i, j, len, size = trees.length;
    var tree, node;

    s_pos = new Object();
    n_pos = 0;

    s_deprel = new Object();
    n_deprel = 0;

    for (i=0; i<size; i++)
    {
        tree = trees[i];
        len = tree.size();

        for (j=1; j<len; j++)
        {
            node = tree.getNode(j);

            if (!(node.pos in s_pos))
                s_pos[node.pos] = n_pos++;

            if (!(node.deprel in s_deprel))
                s_deprel[node.deprel] = n_deprel++;
        }
    }
}

function ensemble(array)
{
    var i, len = array.length, total = 0;

    for (i=0; i<len; i++)
        total += array[i];

    return total;
}

function measureMcNemar()
{
    var i, j, len = s_trees.length;
    mcnemar_las = [];
    mcnemar_uas = [];

    for (i=0; i<len; i++)
    {
        mcnemar_las.push(createArray(len, 0));
        mcnemar_uas.push(createArray(len, 0));
    }

    for (i=0; i<len; i++)
        for (j=i+1; j<len; j++)
            mcnemar1(i, j);
}

function mcnemar1(tree1, tree2)
{
    var sTrees1 = s_trees[tree1];
    var sTrees2 = s_trees[tree2];
    var las = [0,0], uas = [0,0];
    var i, size = g_trees.length;

    for (i=0; i<size; i++)
        mcnemar2(g_trees[i], sTrees1[i], sTrees2[i], las, uas);

    mcnemar_las[tree1][tree2] = getP(las[0], las[1]);
    mcnemar_uas[tree1][tree2] = getP(uas[0], uas[1]);
}

function mcnemar2(gTree, sTree1, sTree2, las, uas)
{
    var i, size = gTree.size();
    var gNode, sNode1, sNode2;
    var u1, u2, l1, l2;

    for (i=1; i<size; i++)
    {
        gNode  = gTree .getNode(i);
        sNode1 = sTree1.getNode(i);
        sNode2 = sTree2.getNode(i);

        u1 = u2 = l1 = l2 = false;

        if (gNode.headId == sNode1.headId)
        {
            u1 = true;
            if (gNode.deprel == sNode1.deprel) l1 = true;
        }

        if (gNode.headId == sNode2.headId)
        {
            u2 = true;
            if (gNode.deprel == sNode2.deprel) l2 = true;
        }

        if ( u1 && !u2) uas[0] += 1;
        if (!u1 &&  u2) uas[1] += 1;
        if ( l1 && !l2) las[0] += 1;
        if (!l1 &&  l2) las[1] += 1;
    }
}

function getP(b, c)
{
    var x2 = (b-c)*(b-c)/(b+c);

    if (x2 >= 10.828)    return 0.001;
    if (x2 >= 9.550)     return 0.002;
    if (x2 >= 7.879)     return 0.005;
    if (x2 >= 6.635)     return 0.01;
    if (x2 >= 5.412)     return 0.02;
    if (x2 >= 5.024)     return 0.025;
    if (x2 >= 3.841)     return 0.05;
    if (x2 >= 3.170)     return 0.075;
    if (x2 >= 2.706)     return 0.10;
    if (x2 >= 1.642)     return 0.20;
    if (x2 >= 1.323)     return 0.25;
    if (x2 >= 0.455)     return 0.5;
    if (x2 >= 0.102)     return 0.75;
    if (x2 >= 0.0158)    return 0.9;
    if (x2 >= 0.00393)   return 0.95;
    if (x2 >= 0.000982)  return 0.975;
    if (x2 >= 0.000157)  return 0.99;
    if (x2 >= 0.000039)  return 0.995;

    return 1.0;
}

function process()
{
    var space = document.getElementById(ID_CHART_SPACE);
    while (space.firstChild) space.removeChild(space.firstChild);

    // clear previous system information
    while (s_scores.length > 0) s_scores.pop();
    while (ensemble_mac_las.length > 0) ensemble_mac_las.pop();
    while (ensemble_mac_uas.length > 0) ensemble_mac_uas.pop();
    while (ensemble_mac_ls .length > 0) ensemble_mac_ls .pop();
    while (ensemble_mic_las.length > 0) ensemble_mic_las.pop();
    while (ensemble_mic_uas.length > 0) ensemble_mic_uas.pop();
    while (ensemble_mic_ls .length > 0) ensemble_mic_ls .pop();

    // add new text-fields given system filenames
    var i, size = s_files.length;

    for (i=0; i<size; i++)
        readDEPTreesFromFile(s_files[i], false, size);
}

function processAux()
{
    var space = document.getElementById(ID_CHART_SPACE);

    // overall
    drawChart(LABELS_ACC, dataOverallTokens, 'column', 'Overall ('+numberWithCommas(s_scores[0].total)+' tokens)');
    drawTable(LABELS_ACC, dataOverallTokens);
    space.appendChild(document.createElement("br"));

    space.appendChild(createHeader(2, 'McNemar Test for LAS (p-values)'));
    drawTableMcNemar(mcnemar_las);
    space.appendChild(document.createElement("br"));

    space.appendChild(createHeader(2, 'McNemar Test for UAS (p-values)'));
    drawTableMcNemar(mcnemar_uas);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_ACC, dataOverallExact, 'column', 'Exact match ('+numberWithCommas(s_scores[0].exact)+' trees)');
    drawTable(LABELS_ACC, dataOverallExact);
    space.appendChild(document.createElement("br"));

    // by sentence length
    drawChart(LABELS_SEN, dataBySentenceLengthLAS, 'line', 'LAS by sentence length');
    drawTable(LABELS_SEN, dataBySentenceLengthLAS, dataBySentenceLengthTotal);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_SEN, dataBySentenceLengthUAS, 'line', 'UAS by sentence length');
    drawTable(LABELS_SEN, dataBySentenceLengthUAS, dataBySentenceLengthTotal);
    space.appendChild(document.createElement("br"));

    // by dependency distance
    var labels = LABELS_DEP.slice(6);

    drawChart(labels, dataByDependencyDistanceLASp, 'line', 'LAS by dependency distance (+)');
    space.appendChild(createText('F1-scores'));
    drawTable(labels, dataByDependencyDistanceLASp);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Precision'));
    drawTable(labels, dataByDependencyDistanceLASpp, dataByDependencyDistanceTotalpp);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Recall'));
    drawTable(labels, dataByDependencyDistanceLASpr, dataByDependencyDistanceTotalpr);
    space.appendChild(document.createElement("br"));

    drawChart(labels, dataByDependencyDistanceUASp, 'line', 'UAS by dependency distance (+)');
    space.appendChild(createText('F1-scores'));
    drawTable(labels, dataByDependencyDistanceUASp);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Precision'));
    drawTable(labels, dataByDependencyDistanceUASpp, dataByDependencyDistanceTotalpp);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Recall'));
    drawTable(labels, dataByDependencyDistanceUASpr, dataByDependencyDistanceTotalpr);
    space.appendChild(document.createElement("br"));

    labels = LABELS_DEP.slice(0, 6);

    drawChart(labels, dataByDependencyDistanceLASn, 'line', 'LAS by dependency distance (-)');
    space.appendChild(createText('F1-scores'));
    drawTable(labels, dataByDependencyDistanceLASn);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Precision'));
    drawTable(labels, dataByDependencyDistanceLASnp, dataByDependencyDistanceTotalnp);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Recall'));
    drawTable(labels, dataByDependencyDistanceLASnr, dataByDependencyDistanceTotalnr);
    space.appendChild(document.createElement("br"));

    drawChart(labels, dataByDependencyDistanceUASn, 'line', 'UAS by dependency distance (-)');
    space.appendChild(createText('F1-scores'));
    drawTable(labels, dataByDependencyDistanceUASn);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Precision'));
    drawTable(labels, dataByDependencyDistanceUASnp, dataByDependencyDistanceTotalnp);
    space.appendChild(document.createElement("br"));
    space.appendChild(createText('Recall'));
    drawTable(labels, dataByDependencyDistanceUASnr, dataByDependencyDistanceTotalnr);
    space.appendChild(document.createElement("br"));

    space.appendChild(createHeader(2, 'LAS by part-of-speech tag'));
    drawTableTags('POS', s_pos, dataByPosLAS, dataByPosTotal);
    space.appendChild(document.createElement("br"));

    space.appendChild(createHeader(2, 'UAS by part-of-speech tag'));
    drawTableTags('POS', s_pos, dataByPosUAS, dataByPosTotal);
    space.appendChild(document.createElement("br"));

    space.appendChild(createHeader(2, 'LAS by dependency label'));
    drawTableTags('DEPREL', s_deprel, dataByDeprelLAS, dataByDeprelTotal);
    space.appendChild(document.createElement("br"));

    space.appendChild(createHeader(2, 'UAS by dependency label'));
    drawTableTags('DEPREL', s_deprel, dataByDeprelUAS, dataByDeprelTotal);
    space.appendChild(document.createElement("br"));

    initEnsemble();

    drawChart(LABELS_ACC, dataOverallTokens, 'column', 'Ensemble Upper Bound ('+numberWithCommas(s_scores[0].total)+' tokens)');
    drawTable(LABELS_ACC, dataOverallTokens);
    space.appendChild(document.createElement("br"));
}

function initEnsemble()
{
    var total = s_scores[0].total;
    while (s_scores.length > 0) s_scores.pop();

    var scores = new Score('Macro', false);
    s_scores.push(scores);

    scores.total = total;
    scores.las = 100.0 * sum(ensemble_mac_las) / total;
    scores.uas = 100.0 * sum(ensemble_mac_uas) / total;
    scores.ls  = 100.0 * sum(ensemble_mac_ls)  / total;

    scores = new Score('Micro', false);
    s_scores.push(scores);

    scores.total = total;
    scores.las = 100.0 * sumNested(ensemble_mic_las) / total;
    scores.uas = 100.0 * sumNested(ensemble_mic_uas) / total;
    scores.ls  = 100.0 * sumNested(ensemble_mic_ls)  / total;
}

// -------------------------------------- Evaluate ---------------------------------------

function Score(name, more)
{
    this.name = name;
    this.init(more);
}

Score.prototype.init = function(more)
{
    // all tokens
    this.total = 0;
    this.las   = 0;
    this.uas   = 0;
    this.ls    = 0;

    // exact matches
    this.exact = 0;
    this.elas  = 0;
    this.euas  = 0;
    this.els   = 0;

    // by dependency distances
    this.dprecision = createArray(DEP_NUM, 0);
    this.drecall    = createArray(DEP_NUM, 0);
    this.dlas       = createArray(DEP_NUM, 0);
    this.duas       = createArray(DEP_NUM, 0);
    this.dlasp      = createArray(DEP_NUM, 0);
    this.dlasr      = createArray(DEP_NUM, 0);
    this.dlasf      = createArray(DEP_NUM, 0);
    this.duasp      = createArray(DEP_NUM, 0);
    this.duasr      = createArray(DEP_NUM, 0);
    this.duasf      = createArray(DEP_NUM, 0);

    // by pos tags
    this.posTotal = createArray(n_pos, 0);
    this.posLAS   = createArray(n_pos, 0);
    this.posUAS   = createArray(n_pos, 0);

    // by dependency labels
    this.deprelTotal = createArray(n_deprel, 0);
    this.deprelLAS   = createArray(n_deprel, 0);
    this.deprelUAS   = createArray(n_deprel, 0);

    if (more)
    {
        // by sentence lengths
        this.stotal = createArray(SEN_NUM, 0);
        this.slas   = createArray(SEN_NUM, 0);
        this.suas   = createArray(SEN_NUM, 0);
    }
}

Score.prototype.addAll = function(score)
{
    this.total += score.total;
    this.las   += score.las;
    this.uas   += score.uas;
    this.ls    += score.ls;

    this.exact += score.exact;
    this.elas  += score.elas;
    this.euas  += score.euas;
    this.els   += score.els;

    var i;

    for (i=0; i<DEP_NUM; i++)
    {
        this.dprecision[i] += score.dprecision[i];
        this.drecall[i]    += score.drecall[i];
        this.dlas[i]       += score.dlas[i];
        this.duas[i]       += score.duas[i];
    }

    for (i=0; i<n_pos; i++)
    {
        this.posTotal[i] += score.posTotal[i];
        this.posLAS[i]   += score.posLAS[i];
        this.posUAS[i]   += score.posUAS[i];
    }

    for (i=0; i<n_deprel; i++)
    {
        this.deprelTotal[i] += score.deprelTotal[i];
        this.deprelLAS[i]   += score.deprelLAS[i];
        this.deprelUAS[i]   += score.deprelUAS[i];
    }
}

Score.prototype.finalize = function(score)
{
    this.las = percent(this.las, this.total);
    this.uas = percent(this.uas, this.total);
    this.ls  = percent(this.ls , this.total);

    this.elas = percent(this.elas, this.exact);
    this.euas = percent(this.euas, this.exact);
    this.els  = percent(this.els , this.exact);

    var i;

    for (i=0; i<SEN_NUM; i++)
    {
        this.slas[i] = percent(this.slas[i] , this.stotal[i]);
        this.suas[i] = percent(this.suas[i] , this.stotal[i]);
    }

    for (i=0; i<DEP_NUM; i++)
    {
        this.dlasp[i] = percent(this.dlas[i], this.dprecision[i]);
        this.dlasr[i] = percent(this.dlas[i], this.drecall[i]);
        this.dlasf[i] = f1(this.dlasp[i], this.dlasr[i]);

        this.duasp[i] = percent(this.duas[i], this.dprecision[i]);
        this.duasr[i] = percent(this.duas[i], this.drecall[i]);
        this.duasf[i] = f1(this.duasp[i], this.duasr[i]);
    }

    for (i=0; i<n_pos; i++)
    {
        this.posLAS[i] = percent(this.posLAS[i], this.posTotal[i]);
        this.posUAS[i] = percent(this.posUAS[i], this.posTotal[i]);
    }

    for (i=0; i<n_deprel; i++)
    {
        this.deprelLAS[i] = percent(this.deprelLAS[i], this.deprelTotal[i]);
        this.deprelUAS[i] = percent(this.deprelUAS[i], this.deprelTotal[i]);
    }
}

function getScores(gTree, sTree, id)
{
    var i, size = gTree.size();
    var scores = new Score(false);
    var gNode, sNode, nsym, gDist, sDist, include;

    if (id < ensemble_mic_las.length)
    {
        var eLas = ensemble_mic_las[id];
        var eUas = ensemble_mic_uas[id];
        var eLs  = ensemble_mic_ls [id];
    }
    else
    {
        var eLas = createArray(size-1, 0); ensemble_mic_las.push(eLas);
        var eUas = createArray(size-1, 0); ensemble_mic_uas.push(eUas);
        var eLs  = createArray(size-1, 0); ensemble_mic_ls .push(eLs);
    }

    for (i=1; i<size; i++)
    {
        gNode  = gTree.getNode(i);
        sNode  = sTree.getNode(i);
        nsym   = !gNode.isSymbol;
        pos    = s_pos[gNode.pos];
        deprel = s_deprel[gNode.deprel];
        gDist  = getDistanceIndex(gNode);
        sDist  = getDistanceIndex(sNode);

        include = include_symbols || nsym;

        if (include)
        {
            scores.total += 1;
            scores.dprecision[sDist] += 1;
            scores.drecall[gDist] += 1;
            scores.posTotal[pos] += 1;
            scores.deprelTotal[deprel] += 1;
        }

        if (gNode.headId == sNode.headId)
        {
            if (include)
            {
                scores.uas += 1;
                scores.duas[gDist] += 1;
                scores.posUAS[pos] += 1;
                scores.deprelUAS[deprel] += 1;
                eUas[i-1] = 1;
            }

            if (gNode.deprel == sNode.deprel)
            {
                if (include)
                {
                    scores.las += 1;
                    scores.dlas[gDist] += 1;
                    scores.posLAS[pos] += 1;
                    scores.deprelLAS[deprel] += 1;
                    eLas[i-1] = 1;
                }
            }
        }

        if (gNode.deprel == sNode.deprel)
        {
            if (include)
            {
                scores.ls += 1
                eLs[i-1] = 1;
            }
        }
    }

    // exact match
    if (scores.total > 0)
    {
        scores.exact += 1
        if (scores.total == scores.las) scores.elas += 1
        if (scores.total == scores.uas) scores.euas += 1
        if (scores.total == scores.ls)  scores.els  += 1
    }

    if (id < ensemble_mac_las.length)
    {
        if (ensemble_mac_las[id] < scores.las) ensemble_mac_las[id] = scores.las;
        if (ensemble_mac_uas[id] < scores.uas) ensemble_mac_uas[id] = scores.uas;
        if (ensemble_mac_ls [id] < scores.ls ) ensemble_mac_ls [id] = scores.ls;
    }
    else
    {
        ensemble_mac_las.push(scores.las);
        ensemble_mac_uas.push(scores.uas);
        ensemble_mac_ls .push(scores.ls);
    }

    return scores;
}

function getDistanceIndex(node)
{
    var dist = node.id - node.headId;

    if (dist < -5) return 0;
    if (dist >  5) return 11;
    if (dist <  0) return dist + 6;
    if (dist >  0) return dist + 5;

    return 0;
}

function addScores(gTrees, sTrees, scores)
{
    var i, size = gTrees.length, tmp, sen;

    for (i=0; i<size; i++)
    {
        if (!include_nonproj && gTrees[i].nonProjective) continue;
        if (!include_proj && !gTrees[i].nonProjective) continue;
        tmp = getScores(gTrees[i], sTrees[i], i);
        scores.addAll(tmp);

        // by sentence length
        sen = Math.floor((tmp.total - 1) / 10);
        if (sen >= SEN_NUM) sen = SEN_NUM - 1;

        scores.stotal[sen] += tmp.total;
        scores.slas[sen]   += tmp.las;
        scores.suas[sen]   += tmp.uas;
    }
}

// ------------------------------------ Chart Overall ------------------------------------

function drawChart(labels, populate, type, title)
{
    var i, size = labels.length, min = 100, tmp, acc;
    var data = [];

    for (i=0; i<size; i++)
        data.push(createChartData(type, labels[i]));

    for (i=0; i<s_scores.length; i++)
    {
        acc = populate(s_scores[i]);

        if (sum(acc) > 0)
        {
            tmp = chartAddDataPoints(data, s_scores[i].name, acc);
            if (tmp > 0) min = Math.min(min, tmp);
        }
    }

    min = Math.floor(min/10) * 10;
    if (min % 10 > 5) min += 5;

    var width = s_scores.length * 120;
    if (width < 300) width = 300;

    var div = document.createElement("div");
    div.style.width  = width.toString()+"px";
    div.style.height = "300px";
    document.getElementById(ID_CHART_SPACE).appendChild(div);

    var chart = new CanvasJS.Chart(div,
    {
      theme: "theme3",
      title:
      {
        text: title,
        fontFamily: "times"
      },
      toolTip:
      {
        shared: true
      },
      axisX:
      {
        lineThickness: 1
      },
      axisY:
      {
        tickThickness: 1,
        lineThickness: 1,
        gridThickness: 0.5,
        minimum: min
      }
    });

    chart.options.data = [];
    for (i=0; i<size; i++)
        chart.options.data.push(data[i]);
    chart.render();
}

function createChartData(chartType, dataName)
{
    var data =
    {
        type: chartType,
        name: dataName,
        showInLegend: true,
        dataPoints: []
    }

    return data;
}

function chartAddDataPoints(data, name, acc)
{
    var i, size = acc.length, min = 100;

    for (i=0; i<size; i++)
    {
        if (acc[i] > 0) min = Math.min(acc[i], min);
        data[i].dataPoints.push({label: name, y: acc[i]});
    }

    return min;
}

// ------------------------------------ Table Overall ------------------------------------

function drawTable(labels, populate, total)
{
    var table = createTable();
    var tr, i, scores;

    // header
    tr = document.createElement('tr');
    table.appendChild(tr);

    tr.appendChild(createTD('center', 'System', TD_WIDTH+20, COLOR_LIGHT_GRAY));

    for (i=0; i<labels.length; i++)
        tr.appendChild(createTD('center', labels[i], TD_WIDTH, COLOR_LIGHT_GRAY));

    // scores
    for (i=0; i<s_scores.length; i++)
    {
        tr = document.createElement('tr');
        table.appendChild(tr);
        scores = s_scores[i];

        tr.appendChild(createTD('center', scores.name, TD_WIDTH+20, COLOR_WHITE));
        tableAddColumns(tr, populate(scores), COLOR_WHITE, 2);
    }

    // total
    if (typeof total != 'undefined')
    {
        tr = document.createElement('tr');
        table.appendChild(tr);
        tr.appendChild(createTD('center', 'Total', TD_WIDTH+20, COLOR_LIGHT_GRAY));
        tableAddColumns(tr, total(scores), COLOR_LIGHT_GRAY, 0);
    }

    document.getElementById(ID_CHART_SPACE).appendChild(table);
}

function createTable()
{
    var table = document.createElement('table');

    table.setAttribute('border', 1);
    table.setAttribute('bordercolor', COLOR_DARK_GRAY);
    table.setAttribute('cellPadding', 0);
    table.setAttribute('cellSpacing', 0);

    return table;
}

function createTD(align, text, width, bgcolor)
{
    var td = document.createElement('td');
    td.setAttribute('align', align);
    td.setAttribute('width', width);
    td.setAttribute('bgcolor', bgcolor);
    td.appendChild(document.createTextNode(text));
    return td;
}

function tableAddColumns(tr, acc, color, prec)
{
    var i, size = acc.length;

    for (i=0; i<size; i++)
        tr.appendChild(createTD('center', acc[i].toFixed(prec), TD_WIDTH, color));
}

// -------------------------------------- Table POS --------------------------------------

function drawTableTags(type, sTags, populate, total)
{
    var i, j, idx, len = s_scores.length;
    var tags = getSortedTags(sTags);
    var acc  = getTagData(populate);
    var table = createTable();
    var n = tags.length;
    var ts  = total();
    var tr, tag;

    tr = document.createElement('tr');
    table.appendChild(tr);

    tr.appendChild(createTD('center', type, TD_WIDTH+20, COLOR_LIGHT_GRAY));
    tr.appendChild(createTD('center', 'Total', TD_WIDTH+20, COLOR_LIGHT_GRAY));

    for (i=0; i<len; i++)
        tr.appendChild(createTD('center', s_scores[i].name, TD_WIDTH+20, COLOR_LIGHT_GRAY));

    for (j=0; j<n; j++)
    {
        tag = tags[j];
        idx = sTags[tag];
        if (ts[idx] == 0) continue;
        tr = document.createElement('tr');
        table.appendChild(tr);

        tr.appendChild(createTD('center', tag, TD_WIDTH+20, COLOR_LIGHT_GRAY));
        tr.appendChild(createTD('center', ts[idx], TD_WIDTH+20, COLOR_WHITE));

        for (i=0; i<len; i++)
            tr.appendChild(createTD('center', acc[i][idx].toFixed(2), TD_WIDTH+20, COLOR_WHITE));
    }

    document.getElementById(ID_CHART_SPACE).appendChild(table);
}

function getTagData(populate)
{
    var i, len = s_scores.length;
    var s = [];

    for (i=0; i<len; i++)
        s.push(populate(s_scores[i]));

    return s;
}

function getSortedTags(sTags)
{
    var tags = [];
    for (var tag in sTags) tags.push(tag);
    tags.sort();
    return tags;
}

// ------------------------------------ Table McNemar ------------------------------------

function drawTableMcNemar(mcnemar)
{
    var i, j, len = s_scores.length;
    var table = createTable();
    var tr, p;

    tr = document.createElement('tr');
    table.appendChild(tr);

    tr.appendChild(createTD('center', '', TD_WIDTH+20, COLOR_LIGHT_GRAY));

    for (i=0; i<len; i++)
        tr.appendChild(createTD('center', s_scores[i].name, TD_WIDTH+20, COLOR_LIGHT_GRAY));

    for (i=0; i<len; i++)
    {
        tr = document.createElement('tr');
        table.appendChild(tr);

        tr.appendChild(createTD('center', s_scores[i].name, TD_WIDTH+20, COLOR_LIGHT_GRAY));

        for (j=0; j<i; j++)
        {
            p = mcnemar[j][i];

            if (p <= 0.05)
                tr.appendChild(createTD('center', p, TD_WIDTH+20, COLOR_PINK));
            else
                tr.appendChild(createTD('center', p, TD_WIDTH+20, COLOR_WHITE));
        }

        tr.appendChild(createTD('center', '', TD_WIDTH+20, COLOR_LIGHT_GRAY));

        for (j=i+1; j<len; j++)
        {
            p = mcnemar[i][j];

            if (p <= 0.05)
                tr.appendChild(createTD('center', p, TD_WIDTH+20, COLOR_PINK));
            else
                tr.appendChild(createTD('center', p, TD_WIDTH+20, COLOR_WHITE));
        }
    }

    document.getElementById(ID_CHART_SPACE).appendChild(table);
}

// ---------------------------------------- Data -----------------------------------------

function dataOverallTokens(scores)
{
    return [scores.las, scores.uas, scores.ls];
}

function dataOverallExact(scores)
{
    return [scores.elas, scores.euas, scores.els];
}

function dataBySentenceLengthLAS(scores)
{
    return scores.slas;
}

function dataBySentenceLengthUAS(scores)
{
    return scores.suas;
}

function dataBySentenceLengthTotal(scores)
{
    return scores.stotal;
}

function dataByDependencyDistanceLASp(scores)
{
    return scores.dlasf.slice(6);
}

function dataByDependencyDistanceUASp(scores)
{
    return scores.duasf.slice(6);
}

function dataByDependencyDistanceLASn(scores)
{
    return scores.dlasf.slice(0, 6);
}

function dataByDependencyDistanceUASn(scores)
{
    return scores.duasf.slice(0, 6);
}

function dataByDependencyDistanceLASpp(scores)
{
    return scores.dlasp.slice(6);
}

function dataByDependencyDistanceUASpp(scores)
{
    return scores.duasp.slice(6);
}

function dataByDependencyDistanceTotalpp(scores)
{
    return scores.dprecision.slice(6);
}

function dataByDependencyDistanceLASnp(scores)
{
    return scores.dlasp.slice(0, 6);
}

function dataByDependencyDistanceUASnp(scores)
{
    return scores.duasp.slice(0, 6);
}

function dataByDependencyDistanceTotalnp(scores)
{
    return scores.dprecision.slice(0, 6);
}

function dataByDependencyDistanceLASpr(scores)
{
    return scores.dlasr.slice(6);
}

function dataByDependencyDistanceUASpr(scores)
{
    return scores.duasr.slice(6);
}

function dataByDependencyDistanceTotalpr(scores)
{
    return scores.drecall.slice(6);
}

function dataByDependencyDistanceLASnr(scores)
{
    return scores.dlasr.slice(0, 6);
}

function dataByDependencyDistanceUASnr(scores)
{
    return scores.duasr.slice(0, 6);
}

function dataByDependencyDistanceTotalnr(scores)
{
    return scores.drecall.slice(0, 6);
}

function dataByPosLAS(scores)
{
    return scores.posLAS;
}

function dataByPosUAS(scores)
{
    return scores.posUAS;
}

function dataByPosTotal()
{
    return s_scores[0].posTotal;
}

function dataByDeprelLAS(scores)
{
    return scores.deprelLAS;
}

function dataByDeprelUAS(scores)
{
    return scores.deprelUAS;
}

function dataByDeprelTotal()
{
    return s_scores[0].deprelTotal;
}

-->
