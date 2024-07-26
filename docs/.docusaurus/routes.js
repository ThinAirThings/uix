import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '759'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '9e1'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'c87'),
            routes: [
              {
                path: '/docs/category/defining-nodes',
                component: ComponentCreator('/docs/category/defining-nodes', '62a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/functions',
                component: ComponentCreator('/docs/category/functions', 'a6e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/getting-started',
                component: ComponentCreator('/docs/category/getting-started', '4e8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/using-uix',
                component: ComponentCreator('/docs/category/using-uix', 'd7a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/defining-nodes/defineNodeSetRelationship',
                component: ComponentCreator('/docs/defining-nodes/defineNodeSetRelationship', '090'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/defining-nodes/definePropertyVector',
                component: ComponentCreator('/docs/defining-nodes/definePropertyVector', '54c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/defining-nodes/defineUniqueIndexes',
                component: ComponentCreator('/docs/defining-nodes/defineUniqueIndexes', '8f8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/defining-nodes/defineUniqueRelationship',
                component: ComponentCreator('/docs/defining-nodes/defineUniqueRelationship', 'cc5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/defining-nodes/defining-a-basic-node',
                component: ComponentCreator('/docs/defining-nodes/defining-a-basic-node', '958'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/createNode',
                component: ComponentCreator('/docs/functions/createNode', '91c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/deleteNode',
                component: ComponentCreator('/docs/functions/deleteNode', '449'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/getAllOfNodeType',
                component: ComponentCreator('/docs/functions/getAllOfNodeType', 'a3c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/getChildNodeSet',
                component: ComponentCreator('/docs/functions/getChildNodeSet', 'de6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/getNodeByIndex',
                component: ComponentCreator('/docs/functions/getNodeByIndex', '456'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/getNodeByKey',
                component: ComponentCreator('/docs/functions/getNodeByKey', '5e5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/getUniqueChildNode',
                component: ComponentCreator('/docs/functions/getUniqueChildNode', 'bc5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/getVectorNodeByKey',
                component: ComponentCreator('/docs/functions/getVectorNodeByKey', '71c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/functions/updateNode',
                component: ComponentCreator('/docs/functions/updateNode', '0a0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/configure-env-vars',
                component: ComponentCreator('/docs/getting-started/configure-env-vars', 'e20'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/define-a-node',
                component: ComponentCreator('/docs/getting-started/define-a-node', '5ac'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/define-config',
                component: ComponentCreator('/docs/getting-started/define-config', '14e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/install-uix',
                component: ComponentCreator('/docs/getting-started/install-uix', '6f7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/running-the-cli',
                component: ComponentCreator('/docs/getting-started/running-the-cli', '4e6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/using-uix/',
                component: ComponentCreator('/docs/using-uix/', '1b9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/using-uix/prerequisites',
                component: ComponentCreator('/docs/using-uix/prerequisites', '691'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
