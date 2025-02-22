/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  DefaultSidebarItemsGenerator,
  type CategoryMetadataFile,
} from '../generator';
import type {Sidebar, SidebarItemsGenerator} from '../types';
import fs from 'fs-extra';
import {DefaultNumberPrefixParser} from '../../numberPrefix';
import {isCategoryIndex} from '../../docs';

describe('DefaultSidebarItemsGenerator', () => {
  function testDefaultSidebarItemsGenerator(
    params: Partial<Parameters<SidebarItemsGenerator>[0]>,
  ) {
    return DefaultSidebarItemsGenerator({
      numberPrefixParser: DefaultNumberPrefixParser,
      isCategoryIndex,
      item: {
        type: 'autogenerated',
        dirName: '.',
      },
      version: {
        versionName: 'current',
        contentPath: 'docs',
      },
      docs: [],
      options: {
        sidebarCollapsed: true,
        sidebarCollapsible: true,
      },
      ...params,
    });
  }

  function mockCategoryMetadataFiles(
    categoryMetadataFiles: Record<string, Partial<CategoryMetadataFile>>,
  ) {
    jest
      .spyOn(fs, 'pathExists')
      .mockImplementation(
        (metadataFilePath) =>
          typeof categoryMetadataFiles[metadataFilePath] !== 'undefined',
      );
    jest.spyOn(fs, 'readFile').mockImplementation(
      // @ts-expect-error: annoying TS error due to overrides
      async (metadataFilePath: string) =>
        JSON.stringify(categoryMetadataFiles[metadataFilePath]),
    );
  }

  test('generates empty sidebar slice when no docs and emit a warning', async () => {
    const consoleWarn = jest.spyOn(console, 'warn');
    const sidebarSlice = await testDefaultSidebarItemsGenerator({
      docs: [],
    });
    expect(sidebarSlice).toEqual([]);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringMatching(
        /.*\[WARNING\].* No docs found in .*\..*: can't auto-generate a sidebar\..*/,
      ),
    );
  });

  test('generates simple flat sidebar', async () => {
    const sidebarSlice = await DefaultSidebarItemsGenerator({
      numberPrefixParser: DefaultNumberPrefixParser,
      item: {
        type: 'autogenerated',
        dirName: '.',
      },
      version: {
        versionName: 'current',
        contentPath: '',
      },
      docs: [
        {
          id: 'doc1',
          source: 'doc1.md',
          sourceDirName: '.',
          sidebarPosition: 2,
          frontMatter: {
            sidebar_label: 'doc1 sidebar label',
          },
        },
        {
          id: 'doc2',
          source: 'doc2.md',
          sourceDirName: '.',
          sidebarPosition: 3,
          frontMatter: {},
        },
        {
          id: 'doc3',
          source: 'doc3.md',
          sourceDirName: '.',
          sidebarPosition: 1,
          frontMatter: {},
        },
        {
          id: 'doc4',
          source: 'doc4.md',
          sourceDirName: '.',
          sidebarPosition: 1.5,
          frontMatter: {},
        },
        {
          id: 'doc5',
          source: 'doc5.md',
          sourceDirName: '.',
          sidebarPosition: undefined,
          frontMatter: {},
        },
      ],
      options: {
        sidebarCollapsed: true,
        sidebarCollapsible: true,
      },
    });

    expect(sidebarSlice).toEqual([
      {type: 'doc', id: 'doc3'},
      {type: 'doc', id: 'doc4'},
      {type: 'doc', id: 'doc1', label: 'doc1 sidebar label'},
      {type: 'doc', id: 'doc2'},
      {type: 'doc', id: 'doc5'},
    ] as Sidebar);
  });

  test('generates complex nested sidebar', async () => {
    mockCategoryMetadataFiles({
      '02-Guides/_category_.json': {collapsed: false} as CategoryMetadataFile,
      '02-Guides/01-SubGuides/_category_.yml': {
        label: 'SubGuides (metadata file label)',
        link: {
          type: 'generated-index',
          slug: 'subguides-generated-index-slug',
          title: 'subguides-title',
          description: 'subguides-description',
        },
      },
    });

    const sidebarSlice = await DefaultSidebarItemsGenerator({
      numberPrefixParser: DefaultNumberPrefixParser,
      isCategoryIndex,
      item: {
        type: 'autogenerated',
        dirName: '.',
      },
      version: {
        versionName: 'current',
        contentPath: '',
      },
      docs: [
        {
          id: 'intro',
          source: '@site/docs/intro.md',
          sourceDirName: '.',
          sidebarPosition: 1,
          frontMatter: {},
        },
        {
          id: 'tutorials-index',
          source: '@site/docs/01-Tutorials/index.md',
          sourceDirName: '01-Tutorials',
          sidebarPosition: 2,
          frontMatter: {},
        },
        {
          id: 'tutorial2',
          source: '@site/docs/01-Tutorials/tutorial2.md',
          sourceDirName: '01-Tutorials',
          sidebarPosition: 2,
          frontMatter: {},
        },
        {
          id: 'tutorial1',
          source: '@site/docs/01-Tutorials/tutorial1.md',
          sourceDirName: '01-Tutorials',
          sidebarPosition: 1,
          frontMatter: {},
        },
        {
          id: 'guides-index',
          source: '@site/docs/02-Guides/02-Guides.md', // TODO should we allow to just use "Guides.md" to have an index?
          sourceDirName: '02-Guides',
          frontMatter: {},
        },
        {
          id: 'guide2',
          source: '@site/docs/02-Guides/guide2.md',
          sourceDirName: '02-Guides',
          sidebarPosition: 2,
          frontMatter: {},
        },
        {
          id: 'guide1',
          source: '@site/docs/02-Guides/guide1.md',
          sourceDirName: '02-Guides',
          sidebarPosition: 1,
          frontMatter: {
            sidebar_class_name: 'foo',
          },
        },
        {
          id: 'nested-guide',
          source: '@site/docs/02-Guides/01-SubGuides/nested-guide.md',
          sourceDirName: '02-Guides/01-SubGuides',
          sidebarPosition: undefined,
          frontMatter: {},
        },
        {
          id: 'end',
          source: '@site/docs/end.md',
          sourceDirName: '.',
          sidebarPosition: 3,
          frontMatter: {},
        },
      ],
      options: {
        sidebarCollapsed: true,
        sidebarCollapsible: true,
      },
    });

    expect(sidebarSlice).toEqual([
      {type: 'doc', id: 'intro'},
      {
        type: 'category',
        label: 'Tutorials',
        collapsed: true,
        collapsible: true,
        link: {
          type: 'doc',
          id: 'tutorials-index',
        },
        items: [
          {type: 'doc', id: 'tutorial1'},
          {type: 'doc', id: 'tutorial2'},
        ],
      },
      {
        type: 'category',
        label: 'Guides',
        collapsed: false,
        collapsible: true,
        link: {
          type: 'doc',
          id: 'guides-index',
        },
        items: [
          {type: 'doc', id: 'guide1', className: 'foo'},
          {
            type: 'category',
            label: 'SubGuides (metadata file label)',
            collapsed: true,
            collapsible: true,
            items: [{type: 'doc', id: 'nested-guide'}],
            link: {
              type: 'generated-index',
              slug: 'subguides-generated-index-slug',
              title: 'subguides-title',
              description: 'subguides-description',
            },
          },
          {type: 'doc', id: 'guide2'},
        ],
      },
      {type: 'doc', id: 'end'},
    ] as Sidebar);
  });

  test('generates subfolder sidebar', async () => {
    // Ensure that category metadata file is correctly read
    // fix edge case found in https://github.com/facebook/docusaurus/issues/4638
    mockCategoryMetadataFiles({
      'subfolder/subsubfolder/subsubsubfolder2/_category_.yml': {
        position: 2,
        label: 'subsubsubfolder2 (_category_.yml label)',
        className: 'bar',
      },
      'subfolder/subsubfolder/subsubsubfolder3/_category_.json': {
        position: 1,
        label: 'subsubsubfolder3 (_category_.json label)',
        collapsible: false,
        collapsed: false,
        link: {
          type: 'doc',
          id: 'doc1', // This is a "fully-qualified" ID that can't be found locally
        },
      },
    });

    const sidebarSlice = await DefaultSidebarItemsGenerator({
      numberPrefixParser: DefaultNumberPrefixParser,
      isCategoryIndex,
      item: {
        type: 'autogenerated',
        dirName: 'subfolder/subsubfolder',
      },
      version: {
        versionName: 'current',
        contentPath: '',
      },
      docs: [
        {
          id: 'doc1',
          source: 'doc1.md',
          sourceDirName: 'subfolder/subsubfolder',
          sidebarPosition: undefined,
          frontMatter: {},
        },
        {
          id: 'doc2',
          source: 'doc2.md',
          sourceDirName: 'subfolder',
          sidebarPosition: undefined,
          frontMatter: {},
        },
        {
          id: 'doc3',
          source: 'doc3.md',
          sourceDirName: '.',
          sidebarPosition: undefined,
          frontMatter: {},
        },
        {
          id: 'doc4',
          source: 'doc4.md',
          sourceDirName: 'subfolder/subsubfolder',
          sidebarPosition: undefined,
          frontMatter: {},
        },
        {
          id: 'doc5',
          source: 'doc5.md',
          sourceDirName: 'subfolder/subsubfolder/subsubsubfolder',
          sidebarPosition: undefined,
          frontMatter: {},
        },
        {
          id: 'doc6',
          source: 'doc6.md',
          sourceDirName: 'subfolder/subsubfolder/subsubsubfolder2',
          sidebarPosition: undefined,
          frontMatter: {},
        },
        {
          id: 'doc7',
          source: 'doc7.md',
          sourceDirName: 'subfolder/subsubfolder/subsubsubfolder3',
          sidebarPosition: 2,
          frontMatter: {},
        },
        {
          id: 'doc8',
          source: 'doc8.md',
          sourceDirName: 'subfolder/subsubfolder/subsubsubfolder3',
          sidebarPosition: 1,
          frontMatter: {},
        },
      ],
      options: {
        sidebarCollapsed: true,
        sidebarCollapsible: true,
      },
    });

    expect(sidebarSlice).toEqual([
      {
        type: 'category',
        label: 'subsubsubfolder3 (_category_.json label)',
        collapsed: false,
        collapsible: false,
        link: {
          id: 'doc1',
          type: 'doc',
        },
        items: [
          {type: 'doc', id: 'doc8'},
          {type: 'doc', id: 'doc7'},
        ],
      },
      {
        type: 'category',
        label: 'subsubsubfolder2 (_category_.yml label)',
        collapsed: true,
        collapsible: true,
        className: 'bar',
        items: [{type: 'doc', id: 'doc6'}],
      },
      {type: 'doc', id: 'doc1'},
      {type: 'doc', id: 'doc4'},
      {
        type: 'category',
        label: 'subsubsubfolder',
        collapsed: true,
        collapsible: true,
        items: [{type: 'doc', id: 'doc5'}],
      },
    ] as Sidebar);
  });

  test('uses explicit link over the index/readme.{md,mdx} naming convention', async () => {
    mockCategoryMetadataFiles({
      'Category/_category_.yml': {
        label: 'Category label',
        link: {
          type: 'doc',
          id: 'doc3', // Using a "local doc id" ("doc1" instead of "parent/doc1") on purpose
        },
      },
    });

    const sidebarSlice = await DefaultSidebarItemsGenerator({
      numberPrefixParser: DefaultNumberPrefixParser,
      item: {
        type: 'autogenerated',
        dirName: '.',
      },
      version: {
        versionName: 'current',
        contentPath: '',
      },
      docs: [
        {
          id: 'parent/doc1',
          source: '@site/docs/Category/index.md',
          sourceDirName: 'Category',
          frontMatter: {},
        },
        {
          id: 'parent/doc2',
          source: '@site/docs/Category/index.md',
          sourceDirName: 'Category',
          frontMatter: {},
        },
        {
          id: 'parent/doc3',
          source: '@site/docs/Category/doc3.md',
          sourceDirName: 'Category',
          frontMatter: {},
        },
      ],
      options: {
        sidebarCollapsed: true,
        sidebarCollapsible: true,
      },
    });

    expect(sidebarSlice).toEqual([
      {
        type: 'category',
        label: 'Category label',
        collapsed: true,
        collapsible: true,
        link: {
          id: 'parent/doc3',
          type: 'doc',
        },
        items: [
          {
            id: 'parent/doc1',
            type: 'doc',
          },
          {
            id: 'parent/doc2',
            type: 'doc',
          },
        ],
      },
    ] as Sidebar);
  });

  test('respects custom isCategoryIndex', async () => {
    const sidebarSlice = await DefaultSidebarItemsGenerator({
      numberPrefixParser: DefaultNumberPrefixParser,
      isCategoryIndex({fileName, directories}) {
        return (
          fileName.replace(
            `${DefaultNumberPrefixParser(
              directories[0],
            ).filename.toLowerCase()}-`,
            '',
          ) === 'index'
        );
      },
      item: {
        type: 'autogenerated',
        dirName: '.',
      },
      version: {
        versionName: 'current',
        contentPath: '',
      },
      docs: [
        {
          id: 'intro',
          source: '@site/docs/intro.md',
          sourceDirName: '.',
          sidebarPosition: 1,
          frontMatter: {},
        },
        {
          id: 'tutorials-index',
          source: '@site/docs/01-Tutorials/tutorials-index.md',
          sourceDirName: '01-Tutorials',
          sidebarPosition: 2,
          frontMatter: {},
        },
        {
          id: 'tutorial2',
          source: '@site/docs/01-Tutorials/tutorial2.md',
          sourceDirName: '01-Tutorials',
          sidebarPosition: 2,
          frontMatter: {},
        },
        {
          id: 'tutorial1',
          source: '@site/docs/01-Tutorials/tutorial1.md',
          sourceDirName: '01-Tutorials',
          sidebarPosition: 1,
          frontMatter: {},
        },
        {
          id: 'not-guides-index',
          source: '@site/docs/02-Guides/README.md',
          sourceDirName: '02-Guides',
          frontMatter: {},
        },
        {
          id: 'guide2',
          source: '@site/docs/02-Guides/guide2.md',
          sourceDirName: '02-Guides',
          sidebarPosition: 2,
          frontMatter: {},
        },
        {
          id: 'guide1',
          source: '@site/docs/02-Guides/guide1.md',
          sourceDirName: '02-Guides',
          sidebarPosition: 1,
          frontMatter: {
            sidebar_class_name: 'foo',
          },
        },
      ],
      options: {
        sidebarCollapsed: true,
        sidebarCollapsible: true,
      },
    });

    expect(sidebarSlice).toEqual([
      {type: 'doc', id: 'intro'},
      {
        type: 'category',
        label: 'Tutorials',
        collapsed: true,
        collapsible: true,
        link: {
          type: 'doc',
          id: 'tutorials-index',
        },
        items: [
          {type: 'doc', id: 'tutorial1'},
          {type: 'doc', id: 'tutorial2'},
        ],
      },
      {
        type: 'category',
        label: 'Guides',
        collapsed: true,
        collapsible: true,
        items: [
          {type: 'doc', id: 'guide1', className: 'foo'},
          {type: 'doc', id: 'guide2'},
          {
            type: 'doc',
            id: 'not-guides-index',
          },
        ],
      },
    ] as Sidebar);
  });
});
