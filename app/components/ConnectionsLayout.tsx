import {
    Card,
    DataTable,
} from '@shopify/polaris';
import { Link } from '@remix-run/react';

import type { Connection } from '../types';
  
const ConnectionsLayout = ({ connections }: { connections: Connection[] }) => {
    const rows = connections.map(
      ({id, storeName, apiKey}) => ([
        <Link to={`connection/${id}`}>{storeName}</Link>,
        apiKey,
      ]),
    );
  
    return (
      <Card>
        <DataTable
          columnContentTypes={['text', 'text']}
          headings={[
            'Store name',
            'API key',
          ]}
          rows={rows}
        />
      </Card>
    );
  }

export { ConnectionsLayout };