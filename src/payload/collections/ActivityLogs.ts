import { CollectionConfig } from 'payload';

const ActivityLogs: CollectionConfig = {
  slug: 'activity-logs',
  admin: {
    useAsTitle: 'action',
  },
  fields: [
    {
      name: 'workerId',
      type: 'text',
      required: true,
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
    },
    {
      name: 'details',
      type: 'json',
      required: false,
    },
  ],
};

export default ActivityLogs;
