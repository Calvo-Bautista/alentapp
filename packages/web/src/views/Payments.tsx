import { 
  Table, 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text, 
  Box,
  Flex,
  Center,
  Badge
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { useState } from "react";

// Interfaces temporales (Mocks)
// Una vez que se apruebe la PR del backend, estos tipos se importarán de @alentapp/shared
interface PaymentMock {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: 'Pending' | 'Paid' | 'Canceled';
  due_date: string;
  member_id: string;
  member_name: string;
}

const MOCK_PAYMENTS: PaymentMock[] = [
  {
    id: "1",
    amount: 1500.50,
    month: 5,
    year: 2026,
    status: 'Pending',
    due_date: "2026-05-10",
    member_id: "m1",
    member_name: "Juan Pérez"
  },
  {
    id: "2",
    amount: 2000,
    month: 4,
    year: 2026,
    status: 'Paid',
    due_date: "2026-04-10",
    member_id: "m2",
    member_name: "María García"
  },
  {
    id: "3",
    amount: 1500.50,
    month: 3,
    year: 2026,
    status: 'Canceled',
    due_date: "2026-03-10",
    member_id: "m1",
    member_name: "Juan Pérez"
  }
];

export function PaymentsView() {
  const [payments] = useState<PaymentMock[]>(MOCK_PAYMENTS);
  const [isLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': return <Badge colorPalette="green" variant="solid">Pagado</Badge>;
      case 'Pending': return <Badge colorPalette="orange" variant="solid">Pendiente</Badge>;
      case 'Canceled': return <Badge colorPalette="red" variant="solid">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Stack gap="8">
      <Flex justify="space-between" align="center">
        <Stack gap="1">
          <Heading size="2xl" fontWeight="bold">Gestión de Pagos</Heading>
          <Text color="fg.muted" fontSize="md">
            Visualiza y registra los pagos y deudas de los socios.
          </Text>
        </Stack>
        <HStack gap="3">
          <Button variant="outline" disabled={isLoading}>
            <LuRefreshCw /> Actualizar
          </Button>
          <Button colorPalette="blue" size="md">
            <LuPlus /> Registrar Pago
          </Button>
        </HStack>
      </Flex>

      <Box 
        bg="bg.panel" 
        borderRadius="xl" 
        boxShadow="sm" 
        borderWidth="1px" 
        overflow="hidden"
        minH="300px"
      >
        <Table.Root size="md" variant="line" interactive>
          <Table.Header>
            <Table.Row bg="bg.muted/50">
              <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
              <Table.ColumnHeader py="4">Período</Table.ColumnHeader>
              <Table.ColumnHeader py="4">Monto</Table.ColumnHeader>
              <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
              <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {payments.map((payment) => (
              <Table.Row key={payment.id} _hover={{ bg: "bg.muted/30" }}>
                <Table.Cell fontWeight="semibold" color="fg.emphasized">
                  {payment.member_name}
                </Table.Cell>
                <Table.Cell color="fg.muted">
                  {payment.month}/{payment.year}
                </Table.Cell>
                <Table.Cell fontWeight="bold">
                  ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Table.Cell>
                <Table.Cell color="fg.muted">
                  {payment.due_date}
                </Table.Cell>
                <Table.Cell>
                  {getStatusBadge(payment.status)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {payments.length === 0 && !isLoading && (
          <Center h="200px">
            <Text color="fg.muted">No hay pagos registrados.</Text>
          </Center>
        )}
      </Box>
    </Stack>
  );
}
