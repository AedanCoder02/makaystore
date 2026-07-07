module.exports = {
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: document.createElement('canvas'),
  })),
  Scene: jest.fn(),
  PerspectiveCamera: jest.fn(),
  Vector3: jest.fn().mockImplementation(() => ({ x: 0, y: 0, z: 0 })),
  Color: jest.fn(),
  ShaderMaterial: jest.fn(),
  PlaneGeometry: jest.fn(),
  Mesh: jest.fn(),
};
