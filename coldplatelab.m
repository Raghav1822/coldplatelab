function coldplatelab()
%COLDPLATELAB Launch the ColdPlateLab liquid-cooling design explorer.
% Run coldplatelab from MATLAB. All built-in design values are illustrative.

designs = coldplatelab_data();
state = struct('visibleIndices', 1:numel(designs), 'activeIndex', 1, ...
    'compareIDs', {{}});

fig = uifigure('Name','ColdPlateLab | Liquid Cooling Design Explorer', ...
    'Position',[80 70 1320 820], 'Color',[0.035 0.085 0.10]);
root = uigridlayout(fig,[2 2]);
root.RowHeight = {58,'1x'};
root.ColumnWidth = {'1.05x','1x'};
root.Padding = [18 16 18 16];
root.RowSpacing = 12;
root.ColumnSpacing = 14;

header = uipanel(root,'BorderType','none','BackgroundColor',[0.035 0.085 0.10]);
header.Layout.Row = 1;
header.Layout.Column = [1 2];
headerGrid = uigridlayout(header,[1 2]);
headerGrid.ColumnWidth = {'1x',240};
headerGrid.Padding = [0 0 0 0];
titleLabel = uilabel(headerGrid,'Text','COLDPLATELAB  /  THERMAL DESIGN EXPLORER', ...
    'FontSize',19,'FontWeight','bold','FontColor',[0.82 0.94 0.89]);
titleLabel.Layout.Column = 1;
statusLabel = uilabel(headerGrid,'Text','08 CONCEPTS  |  INDICATIVE DATA', ...
    'HorizontalAlignment','right','FontSize',10,'FontColor',[0.34 0.83 0.70]);
statusLabel.Layout.Column = 2;

libraryPanel = uipanel(root,'Title','DESIGN LIBRARY', ...
    'FontWeight','bold','ForegroundColor',[0.34 0.83 0.70], ...
    'BackgroundColor',[0.055 0.12 0.14]);
libraryPanel.Layout.Row = 2;
libraryPanel.Layout.Column = 1;
libraryGrid = uigridlayout(libraryPanel,[6 2]);
libraryGrid.RowHeight = {22,32,22,32,34,'1x'};
libraryGrid.ColumnWidth = {'1x','1x'};
libraryGrid.Padding = [12 10 12 12];
libraryGrid.RowSpacing = 7;
libraryGrid.ColumnSpacing = 8;

filterLabel = uilabel(libraryGrid,'Text','FILTER DESIGNS', ...
    'FontSize',10,'FontColor',[0.76 0.87 0.83]);
filterLabel.Layout.Row = 1;
filterLabel.Layout.Column = [1 2];
geometryFilter = uidropdown(libraryGrid, ...
    'Items',{'All geometries','Serpentine','Parallel','Pin-fin'}, ...
    'Value','All geometries','ValueChangedFcn',@refreshLibrary);
geometryFilter.Layout.Row = 2;
geometryFilter.Layout.Column = 1;
applicationFilter = uidropdown(libraryGrid, ...
    'Items',{'All applications','CPU','GPU','Battery','Data center'}, ...
    'Value','All applications','ValueChangedFcn',@refreshLibrary);
applicationFilter.Layout.Row = 2;
applicationFilter.Layout.Column = 2;
searchLabel = uilabel(libraryGrid,'Text','SEARCH  /  SORT', ...
    'FontSize',10,'FontColor',[0.76 0.87 0.83]);
searchLabel.Layout.Row = 3;
searchLabel.Layout.Column = [1 2];
searchField = uieditfield(libraryGrid,'text','Placeholder','Name, geometry, or application', ...
    'ValueChangedFcn',@refreshLibrary);
searchField.Layout.Row = 4;
searchField.Layout.Column = [1 2];
sortDropdown = uidropdown(libraryGrid, ...
    'Items',{'Balanced score','Lowest thermal resistance','Lowest pressure drop', ...
    'Best temperature uniformity'}, ...
    'Value','Balanced score','ValueChangedFcn',@refreshLibrary);
sortDropdown.Layout.Row = 5;
sortDropdown.Layout.Column = 1;
compareButton = uibutton(libraryGrid,'push','Text','COMPARE SELECTED (0)', ...
    'FontWeight','bold','FontColor',[0.035 0.085 0.10], ...
    'BackgroundColor',[0.34 0.83 0.70],'ButtonPushedFcn',@showComparison);
compareButton.Layout.Row = 5;
compareButton.Layout.Column = 2;
designTable = uitable(libraryGrid,'ColumnName', ...
    {'Compare','Design','Geometry','Application','Rth (K/W)','dP (kPa)','Spread (K)'}, ...
    'ColumnEditable',[true false false false false false false], ...
    'ColumnFormat',{'logical','char','char','char','numeric','numeric','numeric'}, ...
    'ColumnWidth',{58,150,90,90,76,76,72}, ...
    'RowName',{},'CellSelectionCallback',@selectDesign, ...
    'CellEditCallback',@toggleComparison);
designTable.Layout.Row = 6;
designTable.Layout.Column = [1 2];

detailPanel = uipanel(root,'Title','DESIGN DEEP DIVE', ...
    'FontWeight','bold','ForegroundColor',[0.34 0.83 0.70], ...
    'BackgroundColor',[0.055 0.12 0.14]);
detailPanel.Layout.Row = 2;
detailPanel.Layout.Column = 2;
detailGrid = uigridlayout(detailPanel,[10 2]);
detailGrid.RowHeight = {24,180,28,46,52,22,62,62,48,30};
detailGrid.ColumnWidth = {'1x','1x'};
detailGrid.Padding = [12 10 12 12];
detailGrid.RowSpacing = 6;
detailGrid.ColumnSpacing = 10;

detailEyebrow = uilabel(detailGrid,'Text','', ...
    'FontSize',9,'FontColor',[0.63 0.79 0.74]);
detailEyebrow.Layout.Row = 1;
detailEyebrow.Layout.Column = [1 2];

schematicAxes = uiaxes(detailGrid);
schematicAxes.Layout.Row = 2;
schematicAxes.Layout.Column = [1 2];
schematicAxes.Color = [0.035 0.085 0.10];
schematicAxes.XColor = [0.035 0.085 0.10];
schematicAxes.YColor = [0.035 0.085 0.10];
schematicAxes.XTick = [];
schematicAxes.YTick = [];
schematicAxes.Box = 'on';
schematicAxes.BoxStyle = 'full';
schematicAxes.LineWidth = 0.5;

designNameLabel = uilabel(detailGrid,'Text','', ...
    'FontSize',17,'FontWeight','bold','FontColor',[0.87 0.95 0.91]);
designNameLabel.Layout.Row = 3;
designNameLabel.Layout.Column = [1 2];
insightLabel = uilabel(detailGrid,'Text','', ...
    'WordWrap','on','FontSize',10,'FontColor',[0.68 0.79 0.76]);
insightLabel.Layout.Row = 4;
insightLabel.Layout.Column = [1 2];
metricsLabel = uilabel(detailGrid,'Text','', ...
    'FontSize',10,'FontColor',[0.34 0.83 0.70], ...
    'BackgroundColor',[0.07 0.16 0.17]);
metricsLabel.Layout.Row = 5;
metricsLabel.Layout.Column = [1 2];
pumpLabel = uilabel(detailGrid,'Text','PUMPING POWER ESTIMATOR', ...
    'FontSize',10,'FontWeight','bold','FontColor',[0.34 0.83 0.70]);
pumpLabel.Layout.Row = 6;
pumpLabel.Layout.Column = [1 2];

flowPanel = uipanel(detailGrid,'Title','FLOW RATE (L/min)', ...
    'ForegroundColor',[0.70 0.83 0.79],'BackgroundColor',[0.055 0.12 0.14]);
flowPanel.Layout.Row = 7;
flowPanel.Layout.Column = 1;
flowGrid = uigridlayout(flowPanel,[2 1]);
flowGrid.RowHeight = {22,'1x'};
flowGrid.Padding = [5 3 5 3];
flowValueLabel = uilabel(flowGrid,'Text','1.5 L/min','FontColor',[0.87 0.95 0.91]);
flowSlider = uislider(flowGrid,'Limits',[0.5 3],'Value',1.5, ...
    'ValueChangedFcn',@updateEstimate);
flowSlider.Layout.Row = 2;

densityPanel = uipanel(detailGrid,'Title','COOLANT DENSITY (kg/m^3)', ...
    'ForegroundColor',[0.70 0.83 0.79],'BackgroundColor',[0.055 0.12 0.14]);
densityPanel.Layout.Row = 7;
densityPanel.Layout.Column = 2;
densityGrid = uigridlayout(densityPanel,[2 1]);
densityGrid.RowHeight = {22,'1x'};
densityGrid.Padding = [5 3 5 3];
densityValueLabel = uilabel(densityGrid,'Text','997 kg/m^3','FontColor',[0.87 0.95 0.91]);
densitySlider = uislider(densityGrid,'Limits',[850 1200],'Value',997, ...
    'ValueChangedFcn',@updateEstimate);
densitySlider.Layout.Row = 2;

efficiencyPanel = uipanel(detailGrid,'Title','PUMP EFFICIENCY (%)', ...
    'ForegroundColor',[0.70 0.83 0.79],'BackgroundColor',[0.055 0.12 0.14]);
efficiencyPanel.Layout.Row = 8;
efficiencyPanel.Layout.Column = 1;
efficiencyGrid = uigridlayout(efficiencyPanel,[2 1]);
efficiencyGrid.RowHeight = {22,'1x'};
efficiencyGrid.Padding = [5 3 5 3];
efficiencyValueLabel = uilabel(efficiencyGrid,'Text','45%','FontColor',[0.87 0.95 0.91]);
efficiencySlider = uislider(efficiencyGrid,'Limits',[20 70],'Value',45, ...
    'ValueChangedFcn',@updateEstimate);
efficiencySlider.Layout.Row = 2;

powerLabel = uilabel(detailGrid,'Text','', ...
    'FontSize',11,'FontWeight','bold','FontColor',[0.87 0.95 0.91], ...
    'BackgroundColor',[0.07 0.16 0.17]);
powerLabel.Layout.Row = 8;
powerLabel.Layout.Column = 2;
noteLabel = uilabel(detailGrid, ...
    'Text','Illustrative scaling only: dP follows flow^2 and coolant density. Excludes plumbing losses.', ...
    'WordWrap','on','FontSize',9,'FontColor',[0.63 0.76 0.72]);
tradeoffLabel = uilabel(detailGrid,'Text','', ...
    'WordWrap','on','FontSize',9,'FontColor',[0.78 0.86 0.82], ...
    'BackgroundColor',[0.07 0.16 0.17]);
tradeoffLabel.Layout.Row = 9;
tradeoffLabel.Layout.Column = [1 2];
noteLabel.Layout.Row = 10;
noteLabel.Layout.Column = [1 2];

refreshLibrary();

    function refreshLibrary(varargin)
        geom = geometryFilter.Value;
        app = applicationFilter.Value;
        query = lower(strtrim(searchField.Value));
        indices = [];
        for n = 1:numel(designs)
            geometryMatches = strcmp(geom,'All geometries') || strcmp(designs(n).Geometry,geom);
            applicationMatches = strcmp(app,'All applications') || strcmp(designs(n).Application,app);
            haystack = lower([designs(n).Name ' ' designs(n).Geometry ' ' ...
                designs(n).Application ' ' designs(n).Description]);
            searchMatches = isempty(query) || contains(haystack,query);
            if geometryMatches && applicationMatches && searchMatches
                indices(end+1) = n; %#ok<AGROW>
            end
        end

        if ~isempty(indices)
            switch sortDropdown.Value
                case 'Lowest thermal resistance'
                    keys = [designs(indices).ThermalResistance];
                case 'Lowest pressure drop'
                    keys = [designs(indices).PressureDropKPa];
                case 'Best temperature uniformity'
                    keys = [designs(indices).TemperatureSpreadK];
                otherwise
                    keys = balancedScores(designs(indices));
            end
            [~,order] = sort(keys,'ascend');
            indices = indices(order);
        end
        state.visibleIndices = indices;

        tableData = cell(numel(indices),7);
        for row = 1:numel(indices)
            item = designs(indices(row));
            tableData{row,1} = any(strcmp(state.compareIDs,item.ID));
            tableData{row,2} = item.Name;
            tableData{row,3} = item.Geometry;
            tableData{row,4} = item.Application;
            tableData{row,5} = item.ThermalResistance;
            tableData{row,6} = item.PressureDropKPa;
            tableData{row,7} = item.TemperatureSpreadK;
        end
        designTable.Data = tableData;
        compareButton.Text = sprintf('COMPARE SELECTED (%d)',numel(state.compareIDs));

        if isempty(indices)
            state.activeIndex = 0;
            designNameLabel.Text = 'No matching concepts';
            insightLabel.Text = 'Try changing the search term or filters.';
            metricsLabel.Text = '';
            detailEyebrow.Text = '';
            tradeoffLabel.Text = '';
            cla(schematicAxes);
            powerLabel.Text = '';
        else
            if ~ismember(state.activeIndex,indices)
                state.activeIndex = indices(1);
            end
            renderDetail();
        end
    end

    function selectDesign(~,event)
        if isempty(event.Indices) || isempty(state.visibleIndices)
            return
        end
        row = event.Indices(1,1);
        if row >= 1 && row <= numel(state.visibleIndices)
            state.activeIndex = state.visibleIndices(row);
            renderDetail();
        end
    end

    function toggleComparison(~,event)
        if isempty(event.Indices) || event.Indices(2) ~= 1
            return
        end
        row = event.Indices(1);
        if row < 1 || row > numel(state.visibleIndices)
            return
        end
        item = designs(state.visibleIndices(row));
        if designTable.Data{row,1}
            if ~any(strcmp(state.compareIDs,item.ID))
                state.compareIDs{end+1} = item.ID;
            end
        else
            state.compareIDs(strcmp(state.compareIDs,item.ID)) = [];
        end
        compareButton.Text = sprintf('COMPARE SELECTED (%d)',numel(state.compareIDs));
    end

    function showComparison(~,~)
        if numel(state.compareIDs) < 2
            uialert(fig,'Select at least two designs using the Compare column.', ...
                'Select designs to compare');
            return
        end
        selected = find(ismember({designs.ID},state.compareIDs));
        comparisonData = cell(numel(selected),6);
        for k = 1:numel(selected)
            item = designs(selected(k));
            comparisonData(k,:) = {item.Name,item.Geometry,item.Application, ...
                item.ThermalResistance,item.PressureDropKPa,item.TemperatureSpreadK};
        end
        compareFigure = uifigure('Name','ColdPlateLab | Side-by-side comparison', ...
            'Position',[180 180 900 340],'Color',[0.035 0.085 0.10]);
        comparisonGrid = uigridlayout(compareFigure,[2 1]);
        comparisonGrid.RowHeight = {38,'1x'};
        uilabel(comparisonGrid,'Text','SIDE-BY-SIDE  /  ILLUSTRATIVE CONCEPT DATA', ...
            'FontWeight','bold','FontColor',[0.34 0.83 0.70]);
        uitable(comparisonGrid,'Data',comparisonData, ...
            'ColumnName',{'Design','Geometry','Application','Rth (K/W)', ...
            'dP (kPa)','Spread (K)'},'RowName',{}, ...
            'ColumnWidth',{190,110,110,110,110,110});
    end

    function updateEstimate(varargin)
        flow = flowSlider.Value;
        density = densitySlider.Value;
        efficiency = efficiencySlider.Value ./ 100;
        flowValueLabel.Text = sprintf('%.2f L/min',flow);
        densityValueLabel.Text = sprintf('%.0f kg/m^3',density);
        efficiencyValueLabel.Text = sprintf('%.0f%%',efficiency.*100);
        if state.activeIndex == 0
            powerLabel.Text = '';
            return
        end
        estimate = coldplatelab_estimate(designs(state.activeIndex), ...
            flow,density,efficiency);
        powerLabel.Text = sprintf('ELECTRICAL INPUT  %.2f W\nPRESSURE DROP  %.2f kPa', ...
            estimate.ElectricalInputW,estimate.PressureDropKPa);
    end

    function renderDetail()
        item = designs(state.activeIndex);
        designNameLabel.Text = sprintf('%s  /  %s  ·  %s', ...
            item.Name,item.Geometry,item.Application);
        insightLabel.Text = item.Insight;
        metricsLabel.Text = sprintf( ...
            'THERMAL R   %.2f K/W     |     dP   %.1f kPa at %.1f L/min     |     SPREAD   %.1f K     |     CHANNELS   %d', ...
            item.ThermalResistance,item.PressureDropKPa, ...
            item.ReferenceFlowLpm,item.TemperatureSpreadK,item.ChannelCount);
        detailEyebrow.Text = sprintf('%s  /  %s  /  %s', ...
            item.Tag,item.Geometry,item.Application);
        tradeoffLabel.Text = sprintf('STRENGTH  %s     |     WATCH FOR  %s', ...
            item.Strength,item.WatchFor);
        drawSchematic(schematicAxes,item.Geometry);
        updateEstimate();
    end
end

function scores = balancedScores(items)
% Equal-weight, min-max normalized score; lower scores rank higher.
thermal = [items.ThermalResistance];
pressure = [items.PressureDropKPa];
spread = [items.TemperatureSpreadK];
scores = normalizeLower(thermal) + normalizeLower(pressure) + normalizeLower(spread);
end

function normalized = normalizeLower(values)
span = max(values)-min(values);
if span == 0
    normalized = zeros(size(values));
else
    normalized = (values-min(values))./span;
end
end

function drawSchematic(ax,geometry)
cla(ax);
hold(ax,'on');
patch(ax,[0.5 9.5 9.5 0.5],[0.5 0.5 4.5 4.5], ...
    [0.07 0.17 0.18],'EdgeColor',[0.22 0.39 0.39],'LineWidth',1.2);
flowColor = [0.34 0.83 0.70];
switch geometry
    case 'Serpentine'
        x = [0.5 1.5 1.5 8.5 8.5 1.5 1.5 8.5 8.5 9.5];
        y = [2.5 2.5 3.8 3.8 2.5 2.5 1.2 1.2 2.5 2.5];
        plot(ax,x,y,'-','Color',flowColor,'LineWidth',4);
    case 'Parallel'
        plot(ax,[2 2],[0.8 4.2],'-','Color',[0.20 0.49 0.48],'LineWidth',3);
        plot(ax,[8 8],[0.8 4.2],'-','Color',[0.20 0.49 0.48],'LineWidth',3);
        for y = 1.1:0.65:3.7
            plot(ax,[0.5 2 8 9.5],[y y y y],'-', ...
                'Color',flowColor,'LineWidth',1.8);
        end
    otherwise
        [pinX,pinY] = meshgrid(2.2:0.9:7.6,1.1:0.65:3.7);
        scatter(ax,pinX(:),pinY(:),35,flowColor,'filled');
        plot(ax,[0.5 1.7],[2.5 2.5],'-','Color',flowColor,'LineWidth',2);
        plot(ax,[8.1 9.5],[2.5 2.5],'-','Color',[0.91 0.66 0.39],'LineWidth',2);
end
plot(ax,0.5,2.5,'o','MarkerSize',8,'MarkerFaceColor',flowColor, ...
    'MarkerEdgeColor',flowColor);
plot(ax,9.5,2.5,'o','MarkerSize',8,'MarkerFaceColor',[0.91 0.66 0.39], ...
    'MarkerEdgeColor',[0.91 0.66 0.39]);
text(ax,0.7,4.12,'INLET','Color',[0.72 0.89 0.83],'FontSize',8);
text(ax,8.55,4.12,'OUTLET','Color',[0.91 0.72 0.49],'FontSize',8);
text(ax,5,0.63,'SCHEMATIC — NOT TO SCALE','Color',[0.55 0.70 0.67], ...
    'FontSize',8,'HorizontalAlignment','center');
xlim(ax,[0 10]);
ylim(ax,[0 5]);
axis(ax,'equal');
ax.XLim = [0 10];
ax.YLim = [0 5];
ax.XTick = [];
ax.YTick = [];
hold(ax,'off');
end
