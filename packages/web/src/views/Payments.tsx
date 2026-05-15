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
  Badge,
  IconButton
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { useState, useEffect, useCallback } from "react";
import { paymentsService } from "../services/payments";
import type { PaymentWithMemberDTO } from "@alentapp/shared";
import { toaster } from "../components/ui/toaster";

export function PaymentsView() {
  const [payments, setPayments] = useState<PaymentWithMemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await paymentsService.getAll();
      setPayments(data as PaymentWithMemberDTO[]);
    } catch (error: any) {
      toaster.create({
        title: "Error",
        description: error.message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleCancelPayment = async (id: string) => {
    if (!confirm("¿Está seguro que desea cancelar este pago?")) return;
    
    try {
      await paymentsService.cancel(id);
      toaster.create({
        title: "Pago cancelado",
        description: "El registro ha sido anulado correctamente.",
        type: "success",
      });
      fetchPayments();
    } catch (error: any) {
      toaster.create({
        title: "Error al cancelar",
        description: error.message,
        type: "error",
      });
    }
  };

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
          <Button variant="outline" onClick={fetchPayments} disabled={isLoading} loading={isLoading}>
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
              <Table.ColumnHeader py="4" textAlign="right">Acciones</Table.ColumnHeader>
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
                <Table.Cell textAlign="right">
                  <IconButton
                    aria-label="Cancelar pago"
                    variant="ghost"
                    colorPalette="red"
                    size="sm"
                    disabled={payment.status !== 'Pending'}
                    onClick={() => handleCancelPayment(payment.id)}
                  >
                    <LuTrash2 />
                  </IconButton>
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
