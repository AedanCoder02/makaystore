const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  refresh: jest.fn(),
  forward: jest.fn(),
});

const usePathname = () => '/';

const useSearchParams = () => ({
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(() => ''),
});

const useParams = () => ({});

const redirect = jest.fn();
const notFound = jest.fn();

module.exports = {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  notFound,
};
