import { Testing, Size } from 'cdk8s';
import { Volume, ConfigMap, EmptyDirMedium } from '../src';
import * as k8s from '../src/imports/k8s';

describe('fromConfigMap', () => {
  test('minimal definition', () => {
    // GIVEN
    const chart = Testing.chart();
    const configMap = new ConfigMap(chart, 'my-config-map');

    // WHEN
    const vol = Volume.fromConfigMap(configMap);

    // THEN
    expect(volumeSpec(vol)).toMatchInlineSnapshot(`
      Object {
        "configMap": Object {
          "defaultMode": undefined,
          "items": undefined,
          "name": "test-my-config-map-configmap-d0fa5644",
          "optional": undefined,
        },
        "name": "configmap-test-my-config-map-configmap-d0fa5644",
      }
    `);
  });

  test('custom volume name', () => {
    // GIVEN
    const chart = Testing.chart();
    const configMap = new ConfigMap(chart, 'my-config-map');

    // WHEN
    const vol = Volume.fromConfigMap(configMap, {
      name: 'filesystem',
    });

    // THEN
    expect(volumeSpec(vol).name).toBe('filesystem');
    expect(volumeSpec(vol).configMap?.name).toBe(
      'test-my-config-map-configmap-d0fa5644',
    );
  });

  test('default mode', () => {
    // GIVEN
    const chart = Testing.chart();
    const configMap = new ConfigMap(chart, 'my-config-map');

    // WHEN
    const vol = Volume.fromConfigMap(configMap, {
      defaultMode: 0o777,
    });

    // THEN
    expect(volumeSpec(vol).configMap?.defaultMode).toBe(0o777);
  });

  test('optional', () => {
    // GIVEN
    const chart = Testing.chart();
    const configMap = new ConfigMap(chart, 'my-config-map');

    // WHEN
    const vol0 = Volume.fromConfigMap(configMap);
    const vol1 = Volume.fromConfigMap(configMap, { optional: true });
    const vol2 = Volume.fromConfigMap(configMap, { optional: false });

    // THEN
    expect(volumeSpec(vol0).configMap?.optional).toBe(undefined);
    expect(volumeSpec(vol1).configMap?.optional).toBe(true);
    expect(volumeSpec(vol2).configMap?.optional).toBe(false);
  });

  test('items', () => {
    // GIVEN
    const chart = Testing.chart();
    const configMap = new ConfigMap(chart, 'my-config-map');

    // WHEN
    const vol = Volume.fromConfigMap(configMap, {
      items: {
        key1: { path: 'path/to/key1' },
        key2: { path: 'path/key2', mode: 0o100 },
      },
    });

    // THEN
    expect(volumeSpec(vol).configMap?.items?.[0]).toStrictEqual({
      key: 'key1',
      mode: undefined,
      path: 'path/to/key1',
    });
    expect(volumeSpec(vol).configMap?.items?.[1]).toStrictEqual({
      key: 'key2',
      mode: 0o100,
      path: 'path/key2',
    });
  });

  test('items are sorted by key for determinstic synthesis', () => {
    // GIVEN
    const chart = Testing.chart();
    const configMap = new ConfigMap(chart, 'my-config-map');

    // WHEN
    const vol = Volume.fromConfigMap(configMap, {
      items: {
        key2: { path: 'path2' },
        key1: { path: 'path1' },
      },
    });

    // THEN
    expect(volumeSpec(vol).configMap?.items?.[0]).toStrictEqual({
      key: 'key1',
      mode: undefined,
      path: 'path1',
    });
    expect(volumeSpec(vol).configMap?.items?.[1]).toStrictEqual({
      key: 'key2',
      mode: undefined,
      path: 'path2',
    });
  });
});

describe('fromEmptyDir', () => {
  test('minimal definition', () => {
    // GIVEN
    const vol = Volume.fromEmptyDir('main');

    // THEN
    expect(volumeSpec(vol)).toStrictEqual({
      name: 'main',
      emptyDir: {
        medium: undefined,
        sizeLimit: undefined,
      },
    });
  });

  test('default medium', () => {
    const vol = Volume.fromEmptyDir('main', { medium: EmptyDirMedium.DEFAULT });
    expect(volumeSpec(vol).emptyDir?.medium).toEqual('');
  });

  test('memory medium', () => {
    const vol = Volume.fromEmptyDir('main', { medium: EmptyDirMedium.MEMORY });
    expect(volumeSpec(vol).emptyDir?.medium).toEqual('Memory');
  });

  test('size limit', () => {
    const vol = Volume.fromEmptyDir('main', { sizeLimit: Size.gibibytes(20) });
    expect(volumeSpec(vol).emptyDir?.sizeLimit).toEqual('20480Mi');
  });
});

function volumeSpec(vol: Volume): k8s.Volume {
  return (vol as any)._toKube();
}