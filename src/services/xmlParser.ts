import { ETLMapping, ETLProject, ETLWorkflow, ETLMaplet, ETLParameter } from '../types';

export async function parseInformaticaXML(xmlContent: string): Promise<ETLProject> {
  console.log("XML Content length:", xmlContent.length);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  
  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    console.error("DOMParser Error:", parseError[0].textContent);
    throw new Error("Error parsing XML: " + parseError[0].textContent);
  }

  const project: ETLProject = {
    mappings: [],
    workflows: [],
    maplets: [],
    parameters: []
  };

  // 1. Parse MAPPINGS
  const mappingElements = xmlDoc.getElementsByTagName("MAPPING");
  for (let i = 0; i < mappingElements.length; i++) {
    const m = mappingElements[i];
    const mapping: ETLMapping = {
      name: m.getAttribute("NAME") || "Unnamed Mapping",
      sources: [],
      targets: [],
      transformations: [],
      lineage: []
    };

    const instances = m.getElementsByTagName("INSTANCE");
    for (let j = 0; j < instances.length; j++) {
      const inst = instances[j];
      const type = inst.getAttribute("TYPE");
      const name = inst.getAttribute("NAME") || "Unnamed Instance";
      const transformationType = inst.getAttribute("TRANSFORMATION_TYPE");
      
      if (type === 'SOURCE') {
        mapping.sources.push({ name, database: inst.getAttribute("DBDNAME") || 'Unknown', fields: [] });
      } else if (type === 'TARGET') {
        mapping.targets.push({ name, database: 'Unknown', fields: [] });
      } else {
        mapping.transformations.push({ name, type: transformationType || 'Transformation' });
      }
    }

    // Extract fields for Sources and Targets if defined in the same XML
    const sourceDefs = xmlDoc.getElementsByTagName("SOURCE");
    for (let j = 0; j < sourceDefs.length; j++) {
      const s = sourceDefs[j];
      const sName = s.getAttribute("NAME");
      const mappingSource = mapping.sources.find(src => src.name === sName);
      if (mappingSource) {
        const fields = s.getElementsByTagName("SOURCEFIELD");
        for (let k = 0; k < fields.length; k++) {
          mappingSource.fields.push(fields[k].getAttribute("NAME") || "");
        }
      }
    }

    const targetDefs = xmlDoc.getElementsByTagName("TARGET");
    for (let j = 0; j < targetDefs.length; j++) {
      const t = targetDefs[j];
      const tName = t.getAttribute("NAME");
      const mappingTarget = mapping.targets.find(tgt => tgt.name === tName);
      if (mappingTarget) {
        const fields = t.getElementsByTagName("TARGETFIELD");
        for (let k = 0; k < fields.length; k++) {
          mappingTarget.fields.push(fields[k].getAttribute("NAME") || "");
        }
      }
    }

    const connectors = m.getElementsByTagName("CONNECTOR");
    for (let j = 0; j < connectors.length; j++) {
      const conn = connectors[j];
      mapping.lineage.push({
        from: conn.getAttribute("FROMINSTANCE") || "",
        to: conn.getAttribute("TOINSTANCE") || "",
        fromField: conn.getAttribute("FROMFIELD") || "",
        toField: conn.getAttribute("TOFIELD") || ""
      });
    }

    const transformations = m.getElementsByTagName("TRANSFORMATION");
    for (let j = 0; j < transformations.length; j++) {
      const t = transformations[j];
      const tName = t.getAttribute("NAME");
      const existing = mapping.transformations.find(tx => tx.name === tName);
      if (existing) {
        existing.description = t.getAttribute("DESCRIPTION") || undefined;
        const fields = t.getElementsByTagName("TRANSFORMFIELD");
        const logicParts: string[] = [];
        for (let k = 0; k < fields.length; k++) {
          const f = fields[k];
          const fExpr = f.getAttribute("EXPRESSION");
          const fName = f.getAttribute("NAME");
          if (fExpr) {
            logicParts.push(`${fName}: ${fExpr}`);
          }
        }
        
        // Also check for specific attributes that define logic
        const tAttributes = t.getElementsByTagName("TABLEATTRIBUTE");
        for (let k = 0; k < tAttributes.length; k++) {
          const attr = tAttributes[k];
          const attrName = attr.getAttribute("NAME");
          const attrValue = attr.getAttribute("VALUE");
          if (attrName?.includes('Condition') || attrName?.includes('Filter Override')) {
            logicParts.push(`${attrName}: ${attrValue}`);
          }
        }

        if (logicParts.length > 0) existing.logic = logicParts.join('\n');
      }
    }
    project.mappings.push(mapping);
  }

  // 2. Parse SESSIONS (as mappings if no MAPPING tag exists, or just extra info)
  const sessionElements = xmlDoc.getElementsByTagName("SESSION");
  for (let i = 0; i < sessionElements.length; i++) {
    const s = sessionElements[i];
    const sessionName = s.getAttribute("NAME") || "Unnamed Session";
    const mappingName = s.getAttribute("MAPPINGNAME");
    
    // Check if we already have this mapping
    if (!project.mappings.find(m => m.name === mappingName)) {
      const mapping: ETLMapping = {
        name: `${sessionName} (${mappingName || 'Session'})`,
        sources: [],
        targets: [],
        transformations: [],
        lineage: []
      };

      const insts = s.getElementsByTagName("SESSTRANSFORMATIONINST");
      for (let j = 0; j < insts.length; j++) {
        const inst = insts[j];
        const name = inst.getAttribute("SINSTANCENAME");
        const type = inst.getAttribute("TRANSFORMATIONTYPE");
        if (!name) continue;
        if (type === 'Source Definition') mapping.sources.push({ name, database: 'Session Connection', fields: [] });
        else if (type === 'Target Definition') mapping.targets.push({ name, database: 'Session Connection', fields: [] });
        else mapping.transformations.push({ name, type: type || 'Transformation' });
      }
      project.mappings.push(mapping);
    }
  }

  // 3. Parse WORKFLOWS
  const workflowElements = xmlDoc.getElementsByTagName("WORKFLOW");
  for (let i = 0; i < workflowElements.length; i++) {
    const w = workflowElements[i];
    const workflow: ETLWorkflow = {
      name: w.getAttribute("NAME") || "Unnamed Workflow",
      description: w.getAttribute("DESCRIPTION") || undefined,
      sessions: [],
      dependencies: []
    };

    const tasks = w.getElementsByTagName("TASKINSTANCE");
    for (let j = 0; j < tasks.length; j++) {
      const t = tasks[j];
      const taskType = t.getAttribute("TASKTYPE");
      const taskName = t.getAttribute("NAME");
      if (taskType === 'Session' || taskType === 'Command' || taskType === 'Email') {
        workflow.sessions.push(taskName || "Unnamed Task");
      }
    }

    const links = w.getElementsByTagName("WORKFLOWLINK");
    for (let j = 0; j < links.length; j++) {
      const l = links[j];
      workflow.dependencies.push({
        from: l.getAttribute("FROMTASK") || "",
        to: l.getAttribute("TOTASK") || ""
      });
    }
    project.workflows.push(workflow);
  }

  // 4. Parse MAPLETS
  const mapletElements = xmlDoc.getElementsByTagName("MAPLET");
  for (let i = 0; i < mapletElements.length; i++) {
    const m = mapletElements[i];
    const maplet: ETLMaplet = {
      name: m.getAttribute("NAME") || "Unnamed Maplet",
      transformations: []
    };
    const trans = m.getElementsByTagName("TRANSFORMATION");
    for (let j = 0; j < trans.length; j++) {
      maplet.transformations.push({
        name: trans[j].getAttribute("NAME") || "",
        type: trans[j].getAttribute("TYPE") || "Transformation"
      });
    }
    project.maplets.push(maplet);
  }

  // 5. Parse PARAMETERS (Attributes with specific names)
  const attributes = xmlDoc.getElementsByTagName("ATTRIBUTE");
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    const name = attr.getAttribute("NAME");
    const value = attr.getAttribute("VALUE");
    if (name && value && (name.startsWith('$$') || name.startsWith('$'))) {
      project.parameters.push({ name, value });
    }
  }

  return project;
}
