const animate = jest.fn().mockReturnValue({ pause: jest.fn(), play: jest.fn() });
const createTimeline = jest.fn().mockReturnValue({
  add: jest.fn().mockReturnThis(),
  play: jest.fn(),
  pause: jest.fn(),
});
const stagger = jest.fn().mockReturnValue(0);
const createDraggable = jest.fn().mockReturnValue({ revert: jest.fn() });

module.exports = {
  animate,
  createTimeline,
  stagger,
  createDraggable,
  default: { animate, createTimeline, stagger },
};
