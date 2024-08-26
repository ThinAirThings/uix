## [1.2.5](https://github.com/ThinAirThings/uix/compare/v1.2.4...v1.2.5) (2024-05-23)

## 4.0.0-next.25

### Patch Changes

- update commit function

## 4.0.0-next.24

### Patch Changes

- moving to non-local linking for local dev

## 4.0.0-next.23

### Patch Changes

- bug fixes

## 4.0.0-next.22

### Patch Changes

- general improvements

## 4.0.0-next.21

### Patch Changes

- fix logs

## 4.0.0-next.20

### Patch Changes

- add logs

## 4.0.0-next.19

### Patch Changes

- add delete/detach caching

## 4.0.0-next.18

### Patch Changes

- fix extract bug

## 4.0.0-next.17

### Patch Changes

- fix extraction bug

## 4.0.0-next.16

### Patch Changes

- general performance improvements

## 4.0.0-next.15

### Patch Changes

- fix: use require instead of dynamic import

## 4.0.0-next.14

### Patch Changes

- fix: fs imports

## 4.0.0-next.13

### Patch Changes

- fix bug in extractSubgraph not allowing parallel calls

## 4.0.0-next.12

### Minor Changes

- update the api for useUix commit

## 4.0.0-next.11

### Minor Changes

- Update caching layer and add draft reset

## 4.0.0-next.10

### Minor Changes

- add detachment and deletion of nodes (rough draft)

## 4.0.0-next.9

### Patch Changes

- remove relationship metadata on drafts

## 4.0.0-next.8

### Patch Changes

- remove print statements

## 4.0.0-next.7

### Patch Changes

- fix bug where records were being duplicated (Lucas' user wraparound bug)

## 4.0.0-next.6

### Patch Changes

- wip

## 4.0.0-next.5

### Minor Changes

- add nested error handling for drafts

### Patch Changes

- 13493c5: fix reverse lookup

## 4.0.0-next.1

### Minor Changes

- rewrote hook architecture

## 4.0.0-next.0

### Major Changes

- Uix v4. Create subgraph system

## 3.0.14

### Patch Changes

- add isPending to all hooks

## 3.0.13

### Patch Changes

- testing

## 3.0.12

### Patch Changes

- update useNodeKey

## 3.0.11

### Patch Changes

- made nodeKey optional to support things like mapped over skeleton loading

## 3.0.10

### Patch Changes

- update before pushing to prod

## 3.0.9

### Patch Changes

- try new driver creation

## 3.0.8

### Patch Changes

- add logs to neo4j driver creation

## 3.0.7

### Patch Changes

- add logs

## 3.0.6

### Patch Changes

- various stability changes

## 3.0.5

### Patch Changes

- update templates

## 3.0.4

### Patch Changes

- wip

## 3.0.3

### Patch Changes

- wip

## 3.0.2

### Patch Changes

- fix string literal types

## 3.0.1

### Patch Changes

- fix hook types with string literal syntax

## 3.0.0

### Major Changes

- d45a9a9: Changed all the get apis to use object style inputs instead of argument lists. This is a breaking change

### Patch Changes

- fixed type bug where getUniqueChild and getNodeSet were resolving to unions due to input type not resolving to the string literal

## 2.4.3

### Patch Changes

- fix uixconfig imports

## 2.4.2

### Patch Changes

- fix: neo4j integers

## 2.4.1

### Patch Changes

- add tests

## 2.4.0

### Minor Changes

- Added correct path resolution for config
  Fixed type issue with setting MatchToRelationshipType

## 2.3.4

### Patch Changes

- swap tsx for bundle-n-require

## 2.3.3

### Patch Changes

- fixing tsImport

## 2.3.2

### Patch Changes

- tsup-node

## 2.3.1

### Patch Changes

- remove circular dep:

## 2.3.0

### Minor Changes

- bring cli back

## 2.2.3

### Patch Changes

- update deps

## 2.2.2

### Patch Changes

- remove unneeded deps

## 2.2.1

### Patch Changes

- update exports in package.json

## 2.2.0

### Minor Changes

- remove cli

## 2.1.4

### Patch Changes

- pin react version

## 2.1.3

### Patch Changes

- update react deps

## 2.1.2

### Patch Changes

- new cli

## 2.1.1

### Patch Changes

- fix: update the vectorTypeEmbedding

## 2.1.0

### Minor Changes

- add matchToRelationshipType

## 2.0.21

### Patch Changes

- fix nodetype vector name

## 2.0.20

### Patch Changes

- fix: update the name of the nodeType vector index

## 2.0.19

### Patch Changes

- update default config path

## 2.0.18

### Patch Changes

- fix delete node recursive delete

## 2.0.17

### Patch Changes

- fix deleteNode

## 2.0.16

### Patch Changes

- wip

## 2.0.15

### Patch Changes

- WIP

## 2.0.14

### Patch Changes

- WIP

## 2.0.13

### Patch Changes

- wip

## 2.0.12

### Patch Changes

- fix required envPath

## 2.0.11

### Patch Changes

- modify envPath

## 2.0.10

### Patch Changes

- add dotenv

## 2.0.9

### Patch Changes

- update package.json

## 2.0.8

### Patch Changes

- update package.json

## 2.0.7

### Patch Changes

- test

## 2.0.6

### Patch Changes

- update

## 2.0.5

### Patch Changes

- update dependencies

## 2.0.6

### Patch Changes

- pin deps

## 2.0.5

### Patch Changes

- update dep versions

## 2.0.4

### Patch Changes

- update dependencies

## 2.0.3

### Patch Changes

- modify dependencies

## 2.0.2

### Patch Changes

- pin react version

## 2.0.1

### Patch Changes

- 76f0d6b: added bin section to package.json

## 2.0.0

### Major Changes

- uix cli with codegen

### Bug Fixes

- bunch of local commits (testing) ([113c5ad](https://github.com/ThinAirThings/uix/commit/113c5ad6b93476f6b0cb41622876e025255da15c))

## [1.2.4](https://github.com/ThinAirThings/uix/compare/v1.2.3...v1.2.4) (2024-05-23)

### Bug Fixes

- testing ([f3eaa82](https://github.com/ThinAirThings/uix/commit/f3eaa8284d406f9f08db08c4e993ec6788741971))

## [1.2.3](https://github.com/ThinAirThings/uix/compare/v1.2.2...v1.2.3) (2024-05-23)

### Bug Fixes

- push before going to local dev ([39eda78](https://github.com/ThinAirThings/uix/commit/39eda78903473789c0436f0b7ad7d7d034cf1e63))

## [1.2.2](https://github.com/ThinAirThings/uix/compare/v1.2.1...v1.2.2) (2024-05-23)

### Bug Fixes

- updater syntax ([696ee1f](https://github.com/ThinAirThings/uix/commit/696ee1fdd3bf214b346c594c61a030d32ecc7f3a))

## [1.2.1](https://github.com/ThinAirThings/uix/compare/v1.2.0...v1.2.1) (2024-05-23)

### Bug Fixes

- updater ([d6994fe](https://github.com/ThinAirThings/uix/commit/d6994fe8a2482595ef7fb6c983c5ea1c18d2db21))

# [1.2.0](https://github.com/ThinAirThings/uix/compare/v1.1.15...v1.2.0) (2024-05-23)

### Features

- shoehorn in an updater function on useNodeState ([44f7ccc](https://github.com/ThinAirThings/uix/commit/44f7ccc196107f55501dc9fdbbc9e0a6214d3ec2))

## [1.1.15](https://github.com/ThinAirThings/uix/compare/v1.1.14...v1.1.15) (2024-05-22)

### Bug Fixes

- update dependency list ([51a7fdb](https://github.com/ThinAirThings/uix/commit/51a7fdb9d75343f71fb623796846e12c622228e1))

## [1.1.14](https://github.com/ThinAirThings/uix/compare/v1.1.13...v1.1.14) (2024-05-17)

### Bug Fixes

- Error handling for unique constraints ([b27b79b](https://github.com/ThinAirThings/uix/commit/b27b79b2dc1793f1115d65d84004011ff60e5a9a))

## [1.1.13](https://github.com/ThinAirThings/uix/compare/v1.1.12...v1.1.13) (2024-05-15)

### Bug Fixes

- remove console logs ([84935ab](https://github.com/ThinAirThings/uix/commit/84935ab7f9393eddb57e8f8770df80842e77786f))

## [1.1.12](https://github.com/ThinAirThings/uix/compare/v1.1.11...v1.1.12) (2024-05-14)

### Bug Fixes

- remove carret for dual-sided relationships ([aed1e28](https://github.com/ThinAirThings/uix/commit/aed1e28f5573886abba68cf42a471ab6d250552d))

## [1.1.11](https://github.com/ThinAirThings/uix/compare/v1.1.10...v1.1.11) (2024-05-14)

### Bug Fixes

- nextjs export name ([e21ff18](https://github.com/ThinAirThings/uix/commit/e21ff18de612faf11563b744ecf366e3cdf46b06))

## [1.1.10](https://github.com/ThinAirThings/uix/compare/v1.1.9...v1.1.10) (2024-05-14)

### Bug Fixes

- nextjs export name ([c0e3aa2](https://github.com/ThinAirThings/uix/commit/c0e3aa22e6b2f84a8d8b82d1cafa4c3e0d92598c))

## [1.1.9](https://github.com/ThinAirThings/uix/compare/v1.1.8...v1.1.9) (2024-05-14)

### Bug Fixes

- implement code splitting ([3a38b54](https://github.com/ThinAirThings/uix/commit/3a38b54e63e93d58855901ec40e62ae49e1eaf9f))

## [1.1.8](https://github.com/ThinAirThings/uix/compare/v1.1.7...v1.1.8) (2024-05-14)

### Bug Fixes

- code splitting ([48edc13](https://github.com/ThinAirThings/uix/commit/48edc13634233721fc622f4ed1e2f809158e19da))

## [1.1.7](https://github.com/ThinAirThings/uix/compare/v1.1.6...v1.1.7) (2024-05-14)

### Bug Fixes

- dependency conflict ([36512df](https://github.com/ThinAirThings/uix/commit/36512dff5326dd597fd0384854aba8055e38ec1d))

## [1.1.6](https://github.com/ThinAirThings/uix/compare/v1.1.5...v1.1.6) (2024-05-14)

## [1.1.5](https://github.com/ThinAirThings/uix/compare/v1.1.4...v1.1.5) (2024-05-06)

### Bug Fixes

- **NextjsCacheLayer:** fix missing invalidations when creating relationships ([a01f7ea](https://github.com/ThinAirThings/uix/commit/a01f7ead3045e95e1f40ff8d8d82992192eea743))

## [1.1.4](https://github.com/ThinAirThings/uix/compare/v1.1.3...v1.1.4) (2024-05-06)

### Bug Fixes

- add more logs ([47b1a38](https://github.com/ThinAirThings/uix/commit/47b1a386583b260ea8125a287a6fd76e0569336a))

## [1.1.3](https://github.com/ThinAirThings/uix/compare/v1.1.2...v1.1.3) (2024-05-06)

### Bug Fixes

- Add log ([17db692](https://github.com/ThinAirThings/uix/commit/17db6929fcc7895998cfd85f23005045f23c70a6))

## [1.1.2](https://github.com/ThinAirThings/uix/compare/v1.1.1...v1.1.2) (2024-05-06)

### Bug Fixes

- add revalidation every 10 seconds ([d3d9e4f](https://github.com/ThinAirThings/uix/commit/d3d9e4fcd503131043fff6bab8d7d13c80aa8006))

## [1.1.1](https://github.com/ThinAirThings/uix/compare/v1.1.0...v1.1.1) (2024-05-03)

### Bug Fixes

- default types ([5f611aa](https://github.com/ThinAirThings/uix/commit/5f611aaa985772f3e0db0ad8148693d5a25bfec1))

# [1.1.0](https://github.com/ThinAirThings/uix/compare/v1.0.27...v1.1.0) (2024-05-03)

### Features

- add react layer ([42579ba](https://github.com/ThinAirThings/uix/commit/42579bab0ce86c8c5c1d8bd526eaafb6a9cf3076))

## [1.0.27](https://github.com/ThinAirThings/uix/compare/v1.0.26...v1.0.27) (2024-05-02)

### Bug Fixes

- release ([401e8f7](https://github.com/ThinAirThings/uix/commit/401e8f78d9190189ccee1e721409656bccce87e5))

## [1.0.26](https://github.com/ThinAirThings/uix/compare/v1.0.25...v1.0.26) (2024-05-02)

### Bug Fixes

- test ([55d618f](https://github.com/ThinAirThings/uix/commit/55d618f237b0c3413b698493159de9bc27123c70))

## [1.0.25](https://github.com/ThinAirThings/uix/compare/v1.0.24...v1.0.25) (2024-05-02)

### Bug Fixes

- test ([fc90ca6](https://github.com/ThinAirThings/uix/commit/fc90ca6cebb26dc9f11df5dc06f64d361cd3c14b))
- test ([c9d77b4](https://github.com/ThinAirThings/uix/commit/c9d77b4818bb32a64fe24ee288f6448e19dbf985))

## [1.0.24](https://github.com/ThinAirThings/uix/compare/v1.0.23...v1.0.24) (2024-05-02)

### Bug Fixes

- release ([edc03b9](https://github.com/ThinAirThings/uix/commit/edc03b9650d53cdb2f1b17b32bd982d440cbd9d7))

## [1.0.23](https://github.com/ThinAirThings/uix/compare/v1.0.22...v1.0.23) (2024-05-02)

### Bug Fixes

- semantic release git assets ([1a526cf](https://github.com/ThinAirThings/uix/commit/1a526cf624b074608ff09187040b4264a592a790))

## [1.0.22](https://github.com/ThinAirThings/uix/compare/v1.0.21...v1.0.22) (2024-05-02)

### Bug Fixes

- release to test package-lock ([f71575a](https://github.com/ThinAirThings/uix/commit/f71575a895a251a18d9d3074b713e28c53b5cab2))

## [1.0.21](https://github.com/ThinAirThings/uix/compare/v1.0.20...v1.0.21) (2024-05-02)

### Bug Fixes

- remove package-lock.json ([bf4c9e1](https://github.com/ThinAirThings/uix/commit/bf4c9e13f80f11274d3ec1daf2fcc20644fb685a))

## [1.0.20](https://github.com/ThinAirThings/uix/compare/v1.0.19...v1.0.20) (2024-05-02)

### Bug Fixes

- ignore files ([4e1ce00](https://github.com/ThinAirThings/uix/commit/4e1ce007b2e0d3d39e0f071aa6781781450659a9))
- install process ([0464a35](https://github.com/ThinAirThings/uix/commit/0464a3556ac94b55bea3598ed7dc21bd7ac80d50))

## [1.0.19](https://github.com/ThinAirThings/uix/compare/v1.0.18...v1.0.19) (2024-05-02)

### Bug Fixes

- test ([dee4efc](https://github.com/ThinAirThings/uix/commit/dee4efc58c0f040979f44ce7115f41f8f400dba7))
- test ([2f9c319](https://github.com/ThinAirThings/uix/commit/2f9c3191e36b00d31c88cb4367db9cc26616a34e))

## [1.0.18](https://github.com/ThinAirThings/uix/compare/v1.0.17...v1.0.18) (2024-05-02)

### Bug Fixes

- release-test ([9ec372d](https://github.com/ThinAirThings/uix/commit/9ec372dc065ff12e4f35dacfe1d9d4c8275453fd))
- release-test ([b04fc3d](https://github.com/ThinAirThings/uix/commit/b04fc3d4e503f7ef9d7090770486ed647ddcb863))
- test release ([513be91](https://github.com/ThinAirThings/uix/commit/513be913164a2a4d59634a24b61e076051328692))

## [1.0.17](https://github.com/ThinAirThings/uix/compare/v1.0.16...v1.0.17) (2024-05-02)

### Bug Fixes

- release ([8eb9134](https://github.com/ThinAirThings/uix/commit/8eb9134d113dce72e8ecf0f662a0a58a3a70dd8a))
- release ([67cc38d](https://github.com/ThinAirThings/uix/commit/67cc38d650f5423cf4c29d7c7c0984c28808a954))
- release ([aad60bb](https://github.com/ThinAirThings/uix/commit/aad60bb16d4060433a4684cd5ac3d750d800c0fd))
- release test ([5d124f3](https://github.com/ThinAirThings/uix/commit/5d124f323cd3341317ba716f8034ce90c7b7ef14))
- release.config filetype ([a85e7dd](https://github.com/ThinAirThings/uix/commit/a85e7dde2f2597c63c094dcf0fd8b640f2bdcf93))

## [1.0.16](https://github.com/ThinAirThings/uix/compare/v1.0.15...v1.0.16) (2024-05-02)

### Bug Fixes

- implement new cache function ([44a944f](https://github.com/ThinAirThings/uix/commit/44a944ff9a1f863e72e2c156fd6c0226c11b321d))

## [1.0.15](https://github.com/ThinAirThings/uix/compare/v1.0.14...v1.0.15) (2024-05-02)

### Bug Fixes

- update caching function ([1d94183](https://github.com/ThinAirThings/uix/commit/1d941831a131cb31970f2e84d033a84d62ae8940))

## [1.0.14](https://github.com/ThinAirThings/uix/compare/v1.0.13...v1.0.14) (2024-05-02)

### Bug Fixes

- add getNodeType recaching ([3efaac0](https://github.com/ThinAirThings/uix/commit/3efaac01faa4c278da6c7ae4f39039e52112a8a7))

## [1.0.13](https://github.com/ThinAirThings/uix/compare/v1.0.12...v1.0.13) (2024-05-02)

### Bug Fixes

- modify return types of nextjs cache ([d2eeb54](https://github.com/ThinAirThings/uix/commit/d2eeb54b3d529e6855f5bd505c7ae6379c83efbe))
- tweak ([2a44a6e](https://github.com/ThinAirThings/uix/commit/2a44a6e7eb235a2ec7e05a7c9aaf31482e8019cb))

## [1.0.12](https://github.com/ThinAirThings/uix/compare/v1.0.11...v1.0.12) (2024-05-01)

### Bug Fixes

- getNodeType invalidation ([6f1069e](https://github.com/ThinAirThings/uix/commit/6f1069e0a79b386c470ad0f0c6258a7ba84e6939))

## [1.0.11](https://github.com/ThinAirThings/uix/compare/v1.0.10...v1.0.11) (2024-05-01)

### Bug Fixes

- merge local changes ([d861f5d](https://github.com/ThinAirThings/uix/commit/d861f5d83117b39ac5516f7dc08db53557a5e67b))
- push ([33564cf](https://github.com/ThinAirThings/uix/commit/33564cf609e4ffdcb83688e49de14d0cc50613eb))
- update ([697d4b5](https://github.com/ThinAirThings/uix/commit/697d4b5fa3256f7c150c774352eea408dce9001d))

## [1.0.10](https://github.com/ThinAirThings/uix/compare/v1.0.9...v1.0.10) (2024-04-29)

### Bug Fixes

- package.json pointing to local verdaccio ([5f5b2fa](https://github.com/ThinAirThings/uix/commit/5f5b2fa92be7d618befe242e876f77b41d1cb570))

## [1.0.9](https://github.com/ThinAirThings/uix/compare/v1.0.8...v1.0.9) (2024-04-29)

### Bug Fixes

- dependencies ([690e9f2](https://github.com/ThinAirThings/uix/commit/690e9f228319c35b325680d25cadff8107bdfa05))
- deps ([8f8b5bd](https://github.com/ThinAirThings/uix/commit/8f8b5bde4d886bd75ebca3a9bb68faf8e06f1be8))

## [1.0.8](https://github.com/ThinAirThings/uix/compare/v1.0.7...v1.0.8) (2024-04-29)

## [1.0.7](https://github.com/ThinAirThings/uix/compare/v1.0.6...v1.0.7) (2024-04-29)

## [1.0.6](https://github.com/ThinAirThings/uix/compare/v1.0.5...v1.0.6) (2024-04-26)

## [1.0.5](https://github.com/ThinAirThings/uix/compare/v1.0.4...v1.0.5) (2024-04-26)

## [1.0.4](https://github.com/ThinAirThings/uix/compare/v1.0.3...v1.0.4) (2024-04-25)

## [1.0.3](https://github.com/ThinAirThings/uix/compare/v1.0.2...v1.0.3) (2024-04-25)

## [1.0.2](https://github.com/ThinAirThings/uix/compare/v1.0.1...v1.0.2) (2024-04-25)

## [1.0.1](https://github.com/ThinAirThings/uix/compare/v1.0.0...v1.0.1) (2024-04-25)

# 1.0.0 (2024-04-25)

### Features

- initial ([0891a42](https://github.com/ThinAirThings/uix/commit/0891a429f59aeea782c49065dd91225b2f2ba318))
